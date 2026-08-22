import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, statusToBadgeProps } from "@/components/ui/Badge";
import { formatNaira, formatDate } from "@/utils/format";

export function LoanCard({ loan }) {
  const { variant, label } = statusToBadgeProps(loan.status);
  return (
    <Link to={`/dashboard/loans/${loan._id || loan.id}`}>
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">{formatNaira(loan.principalAmount || loan.amount)}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {loan.durationMonths} month{loan.durationMonths > 1 ? "s" : ""} · Applied {formatDate(loan.createdAt || loan.appliedDate)}
          </p>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </Card>
    </Link>
  );
}