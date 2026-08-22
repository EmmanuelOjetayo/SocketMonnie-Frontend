// Paystack's published Nigeria local-card pricing: 1.5% + ₦100, capped at
// ₦2,000, with the flat ₦100 waived for transactions under ₦2,500.
// This mirrors the old calculateFlutterwaveFee's "customer pays the fee"
// model — solving for the gross amount so that after Paystack's cut, the
// loan/deposit is credited the exact amount the member intended to pay.
//
// IMPORTANT: confirm this matches your actual negotiated Paystack rate
// (merchant-specific rates can differ from the published default) before
// relying on it in production.
export const calculatePaystackFee = (amount) => {
  const paymentAmount = Number(amount);

  const flatFee = paymentAmount < 2500 ? 0 : 100;
  const rate = 0.015;

  let totalPayable = Math.ceil((paymentAmount + flatFee) / (1 - rate));
  let fee = totalPayable - paymentAmount;

  if (fee > 2000) {
    fee = 2000;
    totalPayable = paymentAmount + fee;
  }

  return {
    amount: paymentAmount,
    fee,
    totalPayable,
  };
};