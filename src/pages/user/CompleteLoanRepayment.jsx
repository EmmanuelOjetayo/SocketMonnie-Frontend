import { useLocation, useNavigate } from "react-router-dom";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";
import { formatNaira } from "@/utils/format";

/**
 * Complete Loan Repayment success page.
 *
 * Displays the outcome of a verified loan repayment through the same
 * SuccessReceipt pattern as the savings deposit success page. Used after
 * a successful loan repayment (init -> checkout -> verify -> success).
 */
export function CompleteLoanRepayment() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const amount = Number(state.amount ?? 0);
  const method = state.method;
  const reference = state.reference ?? state.tx_ref ?? "N/A";
  const remainingBalance = state.remainingBalance;
  const date = state.date || new Date().toISOString();

  const details = [
    { label: "Method", value: method?.replace("_", " ")?.toUpperCase() || "Bank Transfer" },
    { label: "Status", value: "Successful" },
    { label: "Loan Repayment", value: formatNaira(amount) },
    { label: "Outstanding Balance", value: remainingBalance != null ? formatNaira(remainingBalance) : "—" },
    { label: "Date & Time", value: new Date(date).toLocaleString() },
    { label: "Reference ID", value: reference },
  ];

  const actions = [
    {
      label: "Back to Loans",
      variant: "primary",
      onClick: () => navigate(ROUTES.LOANS),
    },
    {
      label: "Back to Dashboard",
      variant: "outline",
      onClick: () => navigate(ROUTES.DASHBOARD),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SuccessReceipt
        title="Loan Repayment Successful"
        amount={amount}
        subtitle="Your loan repayment has been processed successfully."
        details={details}
        actions={actions}
      />
    </div>
  );
}
