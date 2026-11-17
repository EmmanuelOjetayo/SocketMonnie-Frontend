import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TransactionSuccessLayout from "@/components/success/TransactionSuccessLayout";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { getRememberedPaymentRef, clearRememberedPaymentRef } from "@/utils/paymentRef";
import { buildReceiptData } from "@/utils/receiptData";
import { downloadReceiptPdf } from "@/utils/receiptPdf";
import { shareReceipt } from "@/utils/receiptShare";
import { formatNaira } from "@/utils/format";

/**
 * Unified SocketMinutes success page.
 *
 * The backend is the source of truth: polls GET /api/payments/status/:reference
 * which reads the webhook/callback-settled MinuteTransaction record (and
 * reconciles with Flutterwave while still pending). location.state is only a
 * fallback for the placeholder — the green receipt appears only after the
 * backend confirms the contribution. Renders the exact same UI as every other
 * payment result page (TransactionSuccessLayout).
 */
export function MinutesSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const params = new URLSearchParams(location.search);
  const queryRef = params.get("tx_ref") || params.get("reference") || null;

  const reference =
    state.reference ?? state.tx_ref ?? queryRef ?? getRememberedPaymentRef();

  const expectedAmount = Number(state.amount ?? state.totalPayable ?? 0);
  const expectedMonths = Number(state.monthsSettled ?? 1);

  const { transaction, status, isConfirming, error, refresh } = usePaymentConfirmation(reference);

  // Debug: authoritative status snapshot per poll cycle.
  console.log("[MINUTES SUCCESS] status:", status, "ref:", reference, "tx:", transaction?.transactionId, "isConfirming:", isConfirming);

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
  const monthsSettled =
    transaction?.monthsSettled != null ? Number(transaction.monthsSettled) : expectedMonths;

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
      { label: "SocketMinutes Amount", value: formatNaira(confirmedAmount, { decimals: 2 }) },
      { label: "Months Settled", value: String(monthsSettled) },
      ...(isSuccess && transaction?.transactionId
        ? [{ label: "Transaction ID", value: String(transaction.transactionId) }]
        : []),
      {
        label: "Date & Time",
        value: transaction?.paidAt ? new Date(transaction.paidAt).toLocaleString() : "—",
      },
      { label: "Reference ID", value: reference || "N/A" },
    ];
  }, [isSuccess, isFailed, isConfirming, status, transaction, confirmedAmount, monthsSettled, reference]);

  const actions = useMemo(() => {
    if (isSuccess) {
      return [
        { label: "Back to SocketMinutes", variant: "primary", onClick: () => navigate(ROUTES.MINUTES) },
        { label: "Back to Dashboard", variant: "outline", onClick: () => navigate(ROUTES.DASHBOARD) },
      ];
    }
    if (isFailed) {
      return [
        { label: "Try Again", variant: "primary", onClick: () => navigate(ROUTES.MINUTES) },
        { label: "Back to Dashboard", variant: "outline", onClick: () => navigate(ROUTES.DASHBOARD) },
      ];
    }
    return [
      { label: isConfirming ? "Checking status…" : "Refresh Status", variant: "outline", onClick: refresh },
      { label: "Back to SocketMinutes", variant: "outline", onClick: () => navigate(ROUTES.MINUTES) },
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
    ? "SocketMinutes Contribution Successful"
    : isFailed
    ? "Payment Not Confirmed"
    : "Confirming Your Contribution";

  const subtitle = isSuccess
    ? monthsSettled > 1
      ? `Your payment cleared ${monthsSettled} outstanding SocketMinutes contribution(s).`
      : "Your SocketMinutes contribution has been settled successfully."
    : isFailed
    ? error || "We could not confirm this payment."
    : "We are confirming your contribution with the bank. This page updates automatically — you can close it and check back later.";

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
