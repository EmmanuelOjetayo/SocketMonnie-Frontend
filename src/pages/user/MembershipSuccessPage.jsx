import { useLocation, useNavigate } from "react-router-dom";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";
import { formatNaira } from "@/utils/format";

/**
 * Membership fee success page.
 *
 * Rendered after a successful cooperative membership fee payment
 * (init -> checkout -> verify -> success). Displays through the same
 * SuccessReceipt pattern as the savings deposit success page.
 */
export function MembershipSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const amount = Number(state.amount ?? 0);
  const reference = state.reference ?? state.tx_ref ?? "N/A";
  const date = state.date || new Date().toISOString();

  const details = [
    { label: "Status", value: "Successful" },
    { label: "Membership Fee", value: formatNaira(amount) },
    { label: "Date & Time", value: new Date(date).toLocaleString() },
    { label: "Reference ID", value: reference },
  ];

  const actions = [
    {
      label: "Back to Membership",
      variant: "primary",
      onClick: () => navigate(ROUTES.MEMBERSHIP_FEE),
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
        title="Membership Payment Successful"
        amount={amount}
        subtitle="Your membership fee has been received successfully. Savings and loan features are now unlocked."
        details={details}
        actions={actions}
      />
    </div>
  );
}
