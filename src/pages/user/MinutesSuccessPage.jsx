import { useLocation, useNavigate } from "react-router-dom";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";

/**
 * Unified SocketMinutes success page.
 *
 * Rendered after a successful minutes contribution payment
 * (init -> checkout -> verify -> success). Displays through the
 * same SuccessReceipt pattern as the savings deposit success page.
 */
export function MinutesSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const amount = Number(state.amount ?? state.totalPayable ?? 0);
  const reference = state.reference ?? state.tx_ref ?? "N/A";
  const transactionId = state.transactionId ?? null;
  const monthsSettled = Number(state.monthsSettled ?? 1);
  const date = state.date || new Date().toISOString();

  const details = [
    { label: "Status", value: "Successful" },
    { label: "SocketMinutes Amount", value: `₦${amount.toLocaleString()}` },
    { label: "Months Settled", value: String(monthsSettled) },
    ...(transactionId ? [{ label: "Transaction ID", value: String(transactionId) }] : []),
    { label: "Date & Time", value: new Date(date).toLocaleString() },
    { label: "Reference ID", value: reference },
  ];

  const actions = [
    {
      label: "Back to SocketMinutes",
      variant: "primary",
      onClick: () => navigate(ROUTES.MINUTES),
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
        title="SocketMinutes Contribution Successful"
        amount={amount}
        subtitle={
          monthsSettled > 1
            ? `Your payment cleared ${monthsSettled} outstanding SocketMinutes contribution(s).`
            : "Your SocketMinutes contribution has been settled successfully."
        }
        details={details}
        actions={actions}
      />
    </div>
  );
}
