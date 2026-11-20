import { rememberPaymentRef } from "./paymentRef";

/**
 * Navigate to the authoritative payment result page.
 *
 * Webhook-only confirmation:
 *  - The Flutterwave checkout response is only a navigation hint. It is never
 *    treated as proof of payment and never triggers server-side settlement.
 *  - Only the signed server-to-server webhook may settle a payment. The result
 *    page polls GET /api/payments/status/:reference, which is a READ-ONLY view
 *    of the status established by that webhook.
 *  - Pending stays pending until the webhook arrives; the page shows an honest
 *    "confirming" state rather than a green success.
 *
 * @param {Object}   args
 * @param {Function} args.navigate   React Router navigate function
 * @param {string}   args.route      Result route (may include query params)
 * @param {string}   args.reference  Server-generated payment reference (tx_ref)
 * @param {Object}   [args.state]    location.state payload for the result page
 */
export function settleAndNavigate({ navigate, route, reference, state }) {
  // Survives a refresh of the result page (sessionStorage fallback).
  rememberPaymentRef(reference);

  navigate(route, state ? { state } : undefined);
}

export default settleAndNavigate;
