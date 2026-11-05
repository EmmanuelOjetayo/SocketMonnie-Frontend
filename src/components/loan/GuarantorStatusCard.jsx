import { ShieldCheck } from "lucide-react";
import { Badge, statusToBadgeProps } from "@/components/ui/Badge";
import { useAsync } from "@/hooks/useAsync";
import { getGuarantorByLoan } from "@/services/guarantor";

/**
 * Read-only guarantor status for a loan.
 *
 * NOTE: guarantor invitations are NOT created here. Per business policy,
 * the 4 guarantors are selected by referral code during loan application
 * (POST /api/loans/apply), and a rejected/expired guarantor is replaced
 * via POST /api/loans/:loanId/replace-guarantor (see LoanDetails).
 * The backend exposes no "invite a new guarantor by name/email" endpoint.
 */
export function GuarantorStatusCard({ loanId }) {
  const { data, isLoading } = useAsync(() => getGuarantorByLoan(loanId), [loanId]);
  const guarantor = data?.data;

  if (isLoading) return null;

  return (
    <div className="rounded-card border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-brand-600" />
        <h3 className="text-sm font-bold text-text-primary">Guarantor</h3>
      </div>

      {guarantor ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{guarantor.guarantorName}</span>
            <Badge {...statusToBadgeProps(guarantor.status)} />
          </div>
          <p className="text-xs text-text-muted">{guarantor.guarantorEmail}</p>
          {guarantor.status === "rejected" && guarantor.rejectionReason && (
            <p className="text-xs text-danger-600">Reason: {guarantor.rejectionReason}</p>
          )}
          {guarantor.status === "pending" && (
            <p className="text-xs text-text-muted">
              Awaiting response — invitation expires {new Date(guarantor.expiresAt).toLocaleDateString()}.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Guarantor details will appear here once you confirm them during the loan application.
        </p>
      )}
    </div>
  );
}
