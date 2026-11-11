import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { getSavingsSummary } from "@/services/savings";
import toast from "react-hot-toast";

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
  const statePreviousBalance = state.previousBalance;
  const stateNewBalance = state.newBalance;

  // --- Read from URL query params (Flutterwave callback) ---
  const params = new URLSearchParams(location.search);
  const queryTxRef = params.get("tx_ref") || params.get("reference") || state.reference || null;
  const queryTransactionId = params.get("transaction_id") || params.get("transactionId") || state.transactionId || null;
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

  const confirmedAmount = isSuccess && transaction ? Number(transaction.amount || 0) : expectedAmount;
  const displayMethod = transaction?.method || expectedMethod;
  const displayMethodLabel = String(displayMethod || "bank_transfer").replace("_", " ").toUpperCase();

  const receiptStatus = isSuccess ? "successful" : isFailed ? "failed" : "processing";

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
        {
          label: "Download Receipt",
          variant: "outline",
          onClick: () => toast("Receipt download coming soon"),
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

  const title = isSuccess
    ? "Transfer Successful"
    : isFailed
    ? "Payment Not Confirmed"
    : "Confirming Your Payment";

  const subtitle = isSuccess
    ? "Added to your Savings Account"
    : isFailed
    ? error || "We could not confirm this payment."
    : "We are confirming your payment with the bank. This page updates automatically — you can close it and check back later.";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SuccessReceipt
        title={title}
        amount={confirmedAmount}
        subtitle={subtitle}
        details={details}
        actions={actions}
        status={receiptStatus}
      />
    </div>
  );
}
