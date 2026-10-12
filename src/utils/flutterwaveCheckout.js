/**
 * Flutterwave Window Checkout helper.
 * Loads https://checkout.flutterwave.com/v3.js once and wraps
 * FlutterwaveCheckout() in a promise-friendly API.
 *
 * Usage:
 *   const result = await payWithFlutterwave({
 *     publicKey, tx_ref, amount, currency, customer, meta, customizations,
 *     subaccount_id, // server-owned split id — used only here, never logged/stored
 *   });
 *   // result = { status: "successful", transaction_id, tx_ref, ...raw }
 * Checkout is bank-transfer only (payment_options: "banktransfer").
 */

const FLW_INLINE_SCRIPT = "https://checkout.flutterwave.com/v3.js";

let scriptPromise = null;

export function loadFlutterwaveScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is not available."));
  if (window.FlutterwaveCheckout) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${FLW_INLINE_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Flutterwave Checkout SDK failed to load.")), { once: true });
      if (window.FlutterwaveCheckout) resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = FLW_INLINE_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Flutterwave Checkout SDK failed to load. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function payWithFlutterwave({
  publicKey,
  tx_ref,
  amount,
  currency = "NGN",
  customer = {},
  meta = {},
  metadata,
  customizations = {},
  subaccount_id,
}) {
  await loadFlutterwaveScript();

  if (!window.FlutterwaveCheckout) {
    throw new Error("Flutterwave checkout is not loaded.");
  }
  if (!publicKey || !tx_ref || !amount) {
    throw new Error("Invalid payment information received from server.");
  }

  const mergedMeta = { ...(meta || {}), ...(metadata || {}) };

  // SocketMonnie accepts bank transfer only.
  const paymentOptions = "banktransfer";

  // Server-owned split id — injected at runtime into this checkout request
  // only. Never logged, persisted, or forwarded anywhere else.
  const subaccounts =
    subaccount_id && String(subaccount_id).trim()
      ? [{ id: String(subaccount_id).trim() }]
      : undefined;

  return new Promise((resolve, reject) => {
    try {
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref,
        amount: Number(amount),
        currency,
        payment_options: paymentOptions,
        ...(subaccounts ? { subaccounts } : {}),
        customer: {
          email: customer.email,
          name: customer.name,
          phone_number: customer.phone_number || customer.phone || "",
        },
        meta: mergedMeta,
        customizations: {
          title: customizations.title || "SocketMonnie",
          description: customizations.description || "SocketMonnie payment",
          logo: customizations.logo || "",
        },
        callback: (response) => {
          // FLW Inline callback fires on completion; response carries
          // { status, transaction_id, transactionId, tx_ref, txRef, ... }.
          // Normalize field names and status so callers always get
          // snake_case keys and a canonical "successful" status.
          const normalized = {
            ...response,
            status:
              response?.status === "success" || response?.status === "successful"
                ? "successful"
                : response?.status,
            tx_ref: response?.tx_ref || response?.txRef || response?.reference || tx_ref,
            transaction_id:
              response?.transaction_id || response?.transactionId || response?.id || null,
          };
          resolve(normalized);
        },
        onclose: () => {
          reject(new Error("PAYMENT_WINDOW_CLOSED"));
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}

export const isPaymentWindowClosed = (err) =>
  err?.message === "PAYMENT_WINDOW_CLOSED";

export default payWithFlutterwave;