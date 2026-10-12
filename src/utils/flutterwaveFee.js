// Shared Flutterwave fee helper (frontend display ONLY —
// the backend always re-derives and enforces amounts).
// SocketMonnie pricing model: 1.5% + ₦100 (waived under ₦2,500),
// capped at ₦2,000 — gross-up so the member covers the fee.
export const calculateFlutterwaveFee = (amount) => {
  const paymentAmount = Number(amount) || 0;
  if (paymentAmount <= 0) return { amount: paymentAmount, fee: 0, totalPayable: 0 };

  const flatFee = paymentAmount < 2500 ? 0 : 100;
  const rate = 0.015;

  let totalPayable = Math.ceil((paymentAmount + flatFee) / (1 - rate));
  let fee = totalPayable - paymentAmount;

  if (fee > 2000) {
    fee = 2000;
    totalPayable = paymentAmount + fee;
  }

  return { amount: paymentAmount, fee, totalPayable };
};

// Backward-compat alias — same formula, old import path name.
export default calculateFlutterwaveFee;