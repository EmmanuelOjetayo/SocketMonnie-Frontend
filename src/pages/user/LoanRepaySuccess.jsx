import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TopHeader } from "@/components/navigation/TopHeader";
import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ROUTES } from "@/constants/routes";

export function LoanRepaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { amount, method, reference, remainingBalance, date } = location.state || {};

  const details = [
    { label: "Method", value: method?.replace("_", " ")?.toUpperCase() || "Bank Transfer" },
    { label: "Status", value: "Successful" },
    { label: "Date & Time", value: date ? new Date(date).toLocaleString() : new Date().toLocaleString() },
    { label: "Loan Payment", value: `₦${amount?.toLocaleString() || "0"}` },
    { label: "Outstanding Balance", value: `₦${remainingBalance?.toLocaleString() || "0"}` },
    { label: "Reference ID", value: reference || "N/A" },
  ];

  const actions = [
    {
      label: "Back to Loans",
      variant: "primary",
      onClick: () => navigate(ROUTES.LOANS),
    },
    {
      label: "Download Receipt",
      variant: "outline",
      onClick: () => toast("Receipt download coming soon"),
    },
    {
      label: "Share Receipt",
      variant: "outline",
      onClick: () => toast("Share coming soon"),
    },
  ];

  return (
    <div>
      <TopHeader title="Repayment Successful" showBack={false} />
      <SuccessReceipt
        title="Repayment Successful"
        amount={amount || 0}
        subtitle="Your loan payment has been processed."
        details={details}
        actions={actions}
      />
    </div>
  );
}