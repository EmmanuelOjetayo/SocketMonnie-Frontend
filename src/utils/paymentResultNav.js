import { rememberPaymentRef } from "./paymentRef";

/**
 * Trigger server-side settlement and show the payment result page.
 *
 * Design rules (why the checkout callback is NOT the trigger):
 *  - The Flutterwave checkout callback is a navigation HINT, never proof of
 *    payment. With bank-transfer checkout the customer usually switches to
 *    their banking app, pays, and closes the modal — the callback often never
 *    fires. The webhook (server-to-server) and the backend verify endpoint are
 *    the real settlement channels; whichever completes first settles the
 *    transaction server-side.
 *  - The verify request is fired in the BACKGROUND (never awaited, never
 *    gates navigation): it is the second settlement channel that covers a
 *    missed/delayed webhook. Every verify endpoint is idempotent by
 *    reference, so racing the webhook cannot double-credit anything.
 *  - The customer is navigated to the result page immediately. The result
 *    page polls GET /api/payments/status/:reference (backend = source of
 *    truth, which also reconciles against Flutterwave while pending) and
 *    converges on the real outcome: successful → green receipt, failed →
 *    failure state, otherwise an honest "confirming" state with refresh.
 *
 * @param {Object}   args
 * @param {Function} args.navigate   React Router navigate function
 * @param {string}   args.route      Result route (may include query params)
 * @param {string}   args.reference  Server-generated payment reference (tx_ref)
 * @param {Function} [args.verify]   Backend verify endpoint call (fire-and-forget)
 * @param {Object}   [args.state]    location.state payload for the result page
 */
export function settleAndNavigate({ navigate, route, reference, verify, state }) {
  // Survives a refresh of the result page (sessionStorage fallback).
  rememberPaymentRef(reference);

  if (typeof verify === "function") {
    Promise.resolve()
      .then(verify)
      .catch((err) =>
        console.error(
          "[payment] background verify failed (webhook/reconciliation remains the primary settlement channel):",
          err?.message || err
        )
      );
  }

  navigate(route, state ? { state } : undefined);
}

export default settleAndNavigate;
