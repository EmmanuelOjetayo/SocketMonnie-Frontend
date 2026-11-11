import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { getRememberedPaymentRef, clearRememberedPaymentRef } from "@/utils/paymentRef";
import { formatNaira } from "@/utils/format";
import { buildReceiptData } from "@/utils/receiptData";

/**
 * Membership fee success page.
 *
 * The backend is the source of truth: polls GET /api/payments/status/:reference
 * which reads the webhook/callback-settled MembershipTransaction record (and
 * reconciles with Flutterwave while still pending). The green receipt appears
 * only after the backend confirms the fee — never on a browser redirect.
 */
export function MembershipSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const params = new URLSearchParams(location.search);
  const queryRef = params.get("tx_ref") || params.get("reference") || null;

  const reference =
    state.reference ?? state.tx_ref ?? queryRef ?? getRememberedPaymentRef();

  const expectedAmount = Number(state.amount ?? 0);

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
  const receiptStatus = isSuccess ? "successful" : isFailed ? "failed" : "processing";

  // Canonical receipt model — built only from the backend-confirmed record.
  const receipt = useMemo(
    () => (transaction ? buildReceiptData(transaction) : null),
    [transaction]
  );

  const details = useMemo(() => {
    return [
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
      { label: "Membership Fee", value: formatNaira(confirmedAmount) },
      ...(isSuccess && transaction?.transactionId
        ? [{ label: "Transaction ID", value: String(transaction.transactionId) }]
        : []),
      {
        label: "Date & Time",
        value: transaction?.paidAt ? new Date(transaction.paidAt).toLocaleString() : "—",
      },
      { label: "Reference ID", value: reference || "N/A" },
    ];
  }, [isSuccess, isFailed, isConfirming, status, transaction, confirmedAmount, reference]);

  const actions = useMemo(() => {
    if (isSuccess) {
      return [
        { label: "Back to Membership", variant: "primary", onClick: () => navigate(ROUTES.MEMBERSHIP_FEE) },
        { label: "Back to Dashboard", variant: "outline", onClick: () => navigate(ROUTES.DASHBOARD) },
      ];
    }
    if (isFailed) {
      return [
        { label: "Try Again", variant: "primary", onClick: () => navigate(ROUTES.MEMBERSHIP_FEE) },
        { label: "Back to Dashboard", variant: "outline", onClick: () => navigate(ROUTES.DASHBOARD) },
      ];
    }
    return [
      { label: isConfirming ? "Checking status…" : "Refresh Status", variant: "outline", onClick: refresh },
      { label: "Back to Membership", variant: "outline", onClick: () => navigate(ROUTES.MEMBERSHIP_FEE) },
    ];
  }, [isSuccess, isFailed, isConfirming, refresh, navigate]);

  const title = isSuccess
    ? "Membership Payment Successful"
    : isFailed
    ? "Payment Not Confirmed"
    : "Confirming Your Membership Payment";

  const subtitle = isSuccess
    ? "Your membership fee has been received successfully. Savings and loan features are now unlocked."
    : isFailed
    ? error || "We could not confirm this payment."
    : "We are confirming your membership fee with the bank. This page updates automatically — you can close it and check back later.";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
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
