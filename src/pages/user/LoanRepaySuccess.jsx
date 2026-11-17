import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TransactionSuccessLayout from "@/components/success/TransactionSuccessLayout";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { getRememberedPaymentRef, clearRememberedPaymentRef } from "@/utils/paymentRef";
import { formatNaira } from "@/utils/format";
import { buildReceiptData } from "@/utils/receiptData";
import { downloadReceiptPdf } from "@/utils/receiptPdf";
import { shareReceipt } from "@/utils/receiptShare";

/**
 * Loan repayment success page.
 *
 * The backend is the source of truth: polls GET /api/payments/status/:reference
 * which reads the webhook/callback-settled LoanTransaction record (and
 * reconciles with Flutterwave while still pending). location.state is only a
 * fallback for the placeholder — the green receipt appears only after the
 * backend confirms the repayment. Renders the exact same UI as every other
 * payment result page (TransactionSuccessLayout).
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
      { label: "Loan Payment", value: formatNaira(confirmedAmount, { decimals: 2 }) },
      {
        label: "Outstanding Balance",
        value: expectedRemainingBalance != null ? formatNaira(expectedRemainingBalance, { decimals: 2 }) : "—",
      },
      {
        label: "Date & Time",
        value: transaction?.paidAt ? new Date(transaction.paidAt).toLocaleString() : "—",
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

  const handleDownload = async () => {
    if (!receipt) return;
    const toastId = toast.loading("Preparing your receipt...");
    try {
      await downloadReceiptPdf(receipt);
      toast.success("Receipt downloaded", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Could not generate the PDF receipt", { id: toastId });
    }
  };

  const handleShare = async () => {
    if (!receipt) return;
    const toastId = toast.loading("Preparing receipt to share...");
    try {
      const result = await shareReceipt(receipt);
      if (result?.cancelled) {
        toast.dismiss(toastId);
      } else if (result?.method === "clipboard") {
        toast.success("Receipt summary copied to clipboard", { id: toastId });
      } else if (result?.method === "native") {
        toast.success("Receipt shared", { id: toastId });
      } else {
        toast.error("Sharing is not supported on this device", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.message || "Could not share the receipt", { id: toastId });
    }
  };

  const tone = isSuccess ? "success" : isFailed ? "failed" : "pending";

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
    <div className="min-h-screen bg-[#F7F8FB] pb-8">
      <TransactionSuccessLayout
        title={title}
        amount={formatNaira(confirmedAmount, { decimals: 2 })}
        subtitle={subtitle}
        rows={details}
        primaryActions={actions}
        tone={tone}
        showReceiptActions={Boolean(receipt)}
        onDownload={handleDownload}
        onShare={handleShare}
      />
    </div>
  );
}
