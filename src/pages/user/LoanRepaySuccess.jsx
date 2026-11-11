import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TopHeader } from "@/components/navigation/TopHeader";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { getRememberedPaymentRef, clearRememberedPaymentRef } from "@/utils/paymentRef";
import { buildReceiptData } from "@/utils/receiptData";

/**
 * Loan repayment success page.
 *
 * The backend is the source of truth: polls GET /api/payments/status/:reference
 * which reads the webhook/callback-settled LoanTransaction record (and
 * reconciles with Flutterwave while still pending). location.state is only a
 * fallback for the placeholder — the green receipt appears only after the
 * backend confirms the repayment.
 */
export function LoanRepaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const params = new URLSearchParams(location.search);
  const queryRef = params.get("tx_ref") || params.get("reference") || null;

  const reference =
    state.reference ?? state.tx_ref ?? queryRef ?? getRememberedPaymentRef();

  const expectedAmount = Number(state.amount ?? 0);
  const expectedMethod = state.method;
  const expectedRemainingBalance = state.remainingBalance;

  const { transaction, status, isConfirming, error, refresh } = usePaymentConfirmation(reference);

  const isSuccess = status === "successful";
  const isFailed = status === "failed" || status === "not_found";

  useEffect(() => {
    if (status === "successful" || status === "failed" || status === "not_found") {
      clearRememberedPaymentRef();
    }
  }, [status]);

  const confirmedAmount = transaction
    ? Number(transaction.amount || 0)
    : expectedAmount;
  const displayMethod = transaction?.method || expectedMethod || "bank_transfer";
  const receiptStatus = isSuccess ? "successful" : isFailed ? "failed" : "processing";

  // Canonical receipt model — built only from the backend-confirmed record.
  const receipt = useMemo(
    () =>
      transaction
        ? buildReceiptData(transaction, {
            metadata:
              expectedRemainingBalance != null
                ? { remainingBalance: expectedRemainingBalance }
                : {},
          })
        : null,
    [transaction, expectedRemainingBalance]
  );

  const details = useMemo(() => {
    return [
      { label: "Method", value: String(displayMethod).replace("_", " ").toUpperCase() },
      {
        label: "Status",
        value: isSuccess
          ? "Successful"
          : isFailed
          ? "Failed"
          : isConfirming || status === "checking"
          ? "Verifying with bank…"
          : "Pending confirmation",
      },
      {
        label: "Date & Time",
        value: transaction?.paidAt ? new Date(transaction.paidAt).toLocaleString() : "—",
      },
      { label: "Loan Payment", value: `₦${confirmedAmount.toLocaleString()}` },
      {
        label: "Outstanding Balance",
        value: expectedRemainingBalance != null ? `₦${Number(expectedRemainingBalance).toLocaleString()}` : "—",
      },
      ...(isSuccess && transaction?.transactionId
        ? [{ label: "Transaction ID", value: String(transaction.transactionId) }]
        : []),
      { label: "Reference ID", value: reference || "N/A" },
    ];
  }, [displayMethod, isSuccess, isFailed, isConfirming, status, transaction, confirmedAmount, expectedRemainingBalance, reference]);

  const actions = useMemo(() => {
    if (isSuccess) {
      return [
        { label: "Back to Loans", variant: "primary", onClick: () => navigate(ROUTES.LOANS) },
      ];
    }
    if (isFailed) {
      return [
        { label: "Try Again", variant: "primary", onClick: () => navigate(ROUTES.LOANS) },
        { label: "Back to Dashboard", variant: "outline", onClick: () => navigate(ROUTES.DASHBOARD) },
      ];
    }
    return [
      { label: isConfirming ? "Checking status…" : "Refresh Status", variant: "outline", onClick: refresh },
      { label: "Back to Loans", variant: "outline", onClick: () => navigate(ROUTES.LOANS) },
    ];
  }, [isSuccess, isFailed, isConfirming, refresh, navigate]);

  const title = isSuccess
    ? "Repayment Successful"
    : isFailed
    ? "Payment Not Confirmed"
    : "Confirming Your Repayment";

  const subtitle = isSuccess
    ? "Your loan repayment has been processed."
    : isFailed
    ? error || "We could not confirm this payment."
    : "We are confirming your repayment with the bank. This page updates automatically — you can close it and check back later.";

  return (
    <div>
      <TopHeader title={title} showBack={false} />
      <SuccessReceipt
        title={title}
        amount={confirmedAmount}
        subtitle={subtitle}
        details={details}
        actions={actions}
        status={receiptStatus}
        receipt={receipt}
      />
    </div>
  );
}
