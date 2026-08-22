import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";
import { verifyDeposit } from "@/services/payments";
import { getSavingsSummary } from "@/services/savings";
import toast from "react-hot-toast";

/**
 * Unified DepositSuccess page.
 * Fetches getSavingsSummary post-verification to guarantee accurate
 * Previous and Updated Balances.
 */
export function DepositSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Read from location.state (internal deposit) ---
  const state = location.state || {};
  const stateAmount = state.amount;
  const stateMethod = state.method;
  const stateReference = state.reference;
  const statePreviousBalance = state.previousBalance;
  const stateNewBalance = state.newBalance;

  // --- Read from URL query params (Paystack callback) ---
  const params = new URLSearchParams(location.search);
  const queryTxRef = params.get("tx_ref") || params.get("reference") || stateReference || null;
  const queryTransactionId = params.get("transaction_id") || params.get("transactionId") || state.transactionId || null;
  const ref = queryTxRef || "N/A";
  const queryAmount = params.get("amount") ? Number(params.get("amount")) : null;
  const queryMethod = params.get("method") || params.get("paymentMethod") || null;

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  // Dynamic balance state
  const [balances, setBalances] = useState({
    previousBalance: statePreviousBalance ?? null,
    newBalance: stateNewBalance ?? null,
  });

  // --- Final values ---
  const finalAmount = stateAmount ?? queryAmount ?? 0;
  const finalMethod = stateMethod ?? queryMethod ?? "bank_transfer";
  const displayMethod = finalMethod?.replace("_", " ")?.toUpperCase() || "Bank Transfer";

  const paymentStatus = verificationError
    ? "Failed"
    : isVerifying
    ? "Verifying"
    : "Successful";

  useEffect(() => {
    const shouldVerify = queryTransactionId && queryTxRef && !isVerified && !verificationError;
    if (!shouldVerify) return;

    const verifyPayment = async () => {
      setIsVerifying(true);
      try {
        const response = await verifyDeposit({
          transaction_id: queryTransactionId,
          tx_ref: queryTxRef,
        });

        const data = response?.data || response;

        if (response?.success || data?.status === "success" || data?.status === "successful") {
          setIsVerified(true);

          // 1. First preference: Check if backend directly returns balances
          let updatedBal = data?.new_balance ?? data?.updated_balance ?? data?.newBalance ?? null;
          let prevBal = data?.previous_balance ?? data?.previousBalance ?? null;

          // 2. Second preference: Fetch updated balance from savings summary service
          if (updatedBal == null) {
            try {
              const summaryRes = await getSavingsSummary();
              const summary = summaryRes?.summary || summaryRes?.data || summaryRes || {};
              updatedBal = summary?.totalSaved ?? summary?.total_saved ?? null;
            } catch (summaryErr) {
              console.error("Error fetching savings summary:", summaryErr);
            }
          }

          // 3. Mathematical fallback for previous balance
          if (updatedBal != null && prevBal == null && finalAmount > 0) {
            prevBal = Math.max(0, updatedBal - finalAmount);
          }

          setBalances({
            previousBalance: prevBal ?? statePreviousBalance ?? null,
            newBalance: updatedBal ?? stateNewBalance ?? null,
          });

          toast.success("Deposit verified successfully.");
        } else {
          setVerificationError(response?.message || "Verification failed.");
          navigate(ROUTES.PAYMENTS_SAVINGS_FAILED, {
            state: {
              reference: queryTxRef,
              reason: response?.message || "verification_failed",
            },
          });
        }
      } catch (err) {
        console.error("Deposit verification error:", err);
        setVerificationError(err?.message || "Verification failed.");
        navigate(ROUTES.PAYMENTS_SAVINGS_FAILED, {
          state: {
            reference: queryTxRef,
            reason: err?.message || "verification_error",
          },
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [
    queryTransactionId,
    queryTxRef,
    isVerified,
    verificationError,
    navigate,
    finalAmount,
    statePreviousBalance,
    stateNewBalance,
  ]);

  const details = [
    ...(finalMethod ? [{ label: "Method", value: displayMethod }] : []),
    { label: "Status", value: paymentStatus },
    { label: "Date & Time", value: new Date().toLocaleString() },
    ...(balances.previousBalance != null
      ? [{ label: "Previous Balance", value: `₦${Number(balances.previousBalance).toLocaleString()}` }]
      : []),
    ...(balances.newBalance != null
      ? [{ label: "Updated Balance", value: `₦${Number(balances.newBalance).toLocaleString()}` }]
      : []),
    { label: "Reference ID", value: ref },
  ];

  const actions = [
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
    ...(balances.newBalance != null
      ? [
          {
            label: "Share Receipt",
            variant: "outline",
            onClick: () => toast("Share coming soon"),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SuccessReceipt
        title="Transfer Successful"
        amount={finalAmount}
        subtitle={
          isVerifying
            ? "Verifying your payment..."
            : "Added to your Savings Account"
        }
        details={details}
        actions={actions}
      />
    </div>
  );
}