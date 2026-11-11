/**
 * Survives browser refresh on payment success pages.
 *
 * React Router location.state is lost on refresh, and a refreshed success
 * page must never fabricate a receipt. Before navigating to any success page
 * the initiating flow stores the server-generated reference here; the success
 * pages read it as a fallback after state and query params.
 *
 * This is only a REFERENCE (public, non-financial) — the backend still has to
 * confirm the payment; a stale/wrong reference simply 404s and is shown as
 * "not found", never as success.
 */
const KEY = "socketmoni:last_payment_ref";

export function rememberPaymentRef(reference) {
  if (!reference) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ reference: String(reference), at: Date.now() }));
  } catch {
    /* storage unavailable — state/query fallbacks still apply */
  }
}

export function getRememberedPaymentRef() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.reference || null;
  } catch {
    return null;
  }
}

export function clearRememberedPaymentRef() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
