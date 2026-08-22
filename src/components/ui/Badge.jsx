import { cn } from "@/utils/cn";

const VARIANTS = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  info: "bg-info-50 text-info-500",
  neutral: "bg-surface-alt text-text-secondary",
  brand: "bg-brand-50 text-brand-700",
};

/** Small pill used for loan/savings/notification statuses. */
export function Badge({ variant = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Maps a domain status string to a Badge variant + label consistently. */
export function statusToBadgeProps(status) {
  const map = {
    active: { variant: "success", label: "Active" },
    pending: { variant: "warning", label: "Pending" },
    pending_review: { variant: "warning", label: "Pending Review" },
    completed: { variant: "neutral", label: "Completed" },
    overdue: { variant: "danger", label: "Overdue" },
    rejected: { variant: "danger", label: "Rejected" },
    approved: { variant: "success", label: "Approved" },
    paid: { variant: "success", label: "Paid" },
    upcoming: { variant: "info", label: "Upcoming" },
    partially_paid: { variant: "warning", label: "Partially Paid" },
    defaulted: { variant: "danger", label: "Defaulted" },
    warning_30_days: { variant: "warning", label: "Warning (30d)" },
    defaulted_60_days: { variant: "danger", label: "Defaulted (60d)" },
  };
  return map[status] || { variant: "neutral", label: status };
}