import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TransactionSuccessLayout from "@/components/success/TransactionSuccessLayout";
import toast from "react-hot-toast";
import { downloadReceiptPdf } from "@/utils/receiptPdf";
import { shareReceipt } from "@/utils/receiptShare";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { getSavingsSummary } from "@/services/savings";
import { buildReceiptData } from "@/utils/receiptData";
import { formatNaira } from "@/utils/format";

/**
 * Unified DepositSuccess page.
 *
 * The backend is the source of truth: this page polls
 * GET /api/payments/status/:reference, which reads the webhook/callback-settled
 * records and (while pending) triggers one idempotent provider reconciliation.
 * A browser redirect, query param, or location.state is NEVER treated as
 * proof of payment — the green success receipt is only rendered after the
 * backend confirms "successful".
 */
export function DepositSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Read from location.state (internal deposit) ---
  const state = location.state || {};
  const stateAmount = state.amount;
  const stateMethod = state.method;
  const stateNewBalance = state.newBalance;

  // --- Read from URL query params (Flutterwave callback) ---
  const params = new URLSearchParams(location.search);
  const queryTxRef = params.get("tx_ref") || params.get("reference") || state.reference || null;
  const queryAmount = params.get("amount") ? Number(params.get("amount")) : null;
  const queryMethod = params.get("method") || params.get("paymentMethod") || null;

  const reference = queryTxRef;

  // Expected values are only used as fallbacks for the pending placeholder —
  // they are never shown as a confirmed receipt.
  const expectedAmount = stateAmount ?? queryAmount ?? 0;
  const expectedMethod = stateMethod ?? queryMethod ?? "bank_transfer";

  // --- Authoritative backend status polling ---
  const { transaction, status, isConfirming, error, refresh } = usePaymentConfirmation(reference);

  // Latest verified balance (fetched once the backend confirms success).
  const [updatedBalance, setUpdatedBalance] = useState(stateNewBalance ?? null);

  // Debug: authoritative status snapshot per poll cycle.
  console.log("[DEPOSIT SUCCESS] status:", status, "ref:", reference, "tx:", transaction?.transactionId, "isConfirming:", isConfirming);

  const isSuccess = status === "successful";
  const isFailed = status === "failed" || status === "not_found";

  useEffect(() => {
    if (!isSuccess) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const summaryRes = await getSavingsSummary();
        const summary = summaryRes?.summary || summaryRes?.data || summaryRes || {};
        const bal = summary?.totalSaved ?? summary?.total_saved ?? null;
        if (!cancelled && bal != null) setUpdatedBalance(bal);
      } catch {
        // Balance is cosmetic — the receipt itself is already confirmed.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuccess]);

  // No reference at all → nothing to verify, never fabricate a receipt.
  useEffect(() => {
    if (!reference) {
      navigate(ROUTES.SAVINGS || "/savings", { replace: true });
    }
  }, [reference, navigate]);

  const confirmedAmount = transaction
    ? Number(transaction.amount || 0)
    : expectedAmount;
  const displayMethod = transaction?.method || expectedMethod;
  const displayMethodLabel = String(displayMethod || "bank_transfer").replace("_", " ").toUpperCase();

  // receipt status is modeled by the `tone` prop passed to TransactionSuccessLayout.
  // Canonical receipt model — built ONLY from the backend record. Without a
  // backend record there is no receipt to download, so a pending/unknown
  // payment can never produce a printable "successful" receipt.
  const receipt = useMemo(
    () =>
      transaction
        ? buildReceiptData(transaction, {
            metadata: updatedBalance != null ? { balanceAfter: updatedBalance } : {},
          })
        : null,
    [transaction, updatedBalance]
  );

  const details = useMemo(() => {
    const rows = [
      { label: "Method", value: displayMethodLabel },
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
      ...(updatedBalance != null
        ? [{ label: "Updated Balance", value: `₦${Number(updatedBalance).toLocaleString()}` }]
        : []),
      { label: "Reference ID", value: reference || "N/A" },
      ...(transaction?.transactionId
        ? [{ label: "Transaction ID", value: String(transaction.transactionId) }]
        : []),
    ];
    return rows;
  }, [displayMethodLabel, isSuccess, isFailed, isConfirming, status, transaction, updatedBalance, reference]);

  const actions = useMemo(() => {
    if (isSuccess) {
      return [
        {
          label: "Back to Savings",
          variant: "primary",
          onClick: () => navigate(ROUTES.SAVINGS || "/savings"),
        },
      ];
    }
    if (isFailed) {
      return [
        {
          label: "Try Again",
          variant: "primary",
          onClick: () => navigate(ROUTES.SAVINGS_DEPOSIT || "/savings/deposit"),
        },
        {
          label: "Back to Savings",
          variant: "outline",
          onClick: () => navigate(ROUTES.SAVINGS || "/savings"),
        },
      ];
    }
    // Pending / verifying
    return [
      {
        label: isConfirming ? "Checking status…" : "Refresh Status",
        variant: "outline",
        onClick: refresh,
      },
      {
        label: "Back to Savings",
        variant: "outline",
        onClick: () => navigate(ROUTES.SAVINGS || "/savings"),
      },
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
    ? "Deposit Successful"
    : isFailed
    ? "Payment Not Confirmed"
    : "Confirming Your Payment";

  const subtitle = isSuccess
    ? "Added to your Savings Account"
    : isFailed
    ? error || "We could not confirm this payment."
    : "We are confirming your payment with the bank. This page updates automatically — you can close it and check back later.";

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
