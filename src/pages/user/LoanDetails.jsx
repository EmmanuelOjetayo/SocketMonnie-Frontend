import { useParams, useNavigate } from "react-router-dom";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Button } from "@/components/ui/Button";
import { LoanSummaryCard } from "@/components/loan/LoanSummaryCard";
import { PaymentSchedule } from "@/components/loan/PaymentSchedule";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { getLoanById, getRepaymentSchedule } from "@/services/loans";
import { ROUTES } from "@/constants/routes";

export function LoanDetails() {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const { data: loan, isLoading: loadingLoan } = useAsync(
    () => getLoanById(loanId),
    [loanId]
  );
  const { data: scheduleData, isLoading: loadingSchedule } = useAsync(
    () => getRepaymentSchedule(loanId),
    [loanId]
  );
  const schedule = scheduleData?.schedule || (Array.isArray(scheduleData) ? scheduleData : []);

  if (loadingLoan) {
    return (
      <div>
        <TopHeader title="Loan Details" showBack />
        <div className="px-5">
          <LoadingState rows={3} />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div>
        <TopHeader title="Loan Details" showBack />
        <div className="px-5">
          <EmptyState title="Loan not found" description="The loan you're looking for doesn't exist." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopHeader title="Loan Details" showBack />
      <div className="px-5 pb-8 space-y-5">
        <LoanSummaryCard loan={loan} />

        <div>
          <h2 className="text-sm font-bold text-text-primary mb-3">Repayment Schedule</h2>
          {loadingSchedule ? (
            <LoadingState rows={3} />
          ) : schedule && schedule.length > 0 ? (
            <PaymentSchedule installments={schedule} />
          ) : (
            <EmptyState title="No schedule available" />
          )}
        </div>

        {["active", "warning_30_days", "defaulted_60_days", "restricted_90_days", "recovery_120_days"].includes(loan.status) && loan.remainingBalance > 0 && (
          <Button fullWidth onClick={() => navigate(ROUTES.LOAN_REPAY)}>
            Make Repayment
          </Button>
        )}

        {/* Display payout/disbursement status for active/confirmed loans */}
        {loan.status === "active" && (
          <div className="mt-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 text-xs text-emerald-700">
            <strong>Disbursement Status:</strong> {loan.payoutStatus === "completed" ? "Manual disbursement confirmed" : loan.payoutStatus || "pending"}
          </div>
        )}

        {/* Display disbursement reference and net amount */}
        {loan.status === "active" && loan.payoutReference && (
          <div className="mt-2">
            <strong>Disbursement Reference:</strong> {loan.payoutReference}
          </div>
        )}

        {loan.status === "active" && (
          <div className="mt-2 small text-gray-500">
            <strong>Net Amount Disbursed:</strong> {formatNaira(loan.disbursementAmount || Math.max(0, (loan.principalAmount || 0) - (loan.interestAmount || 0)))}
          </div>
        )}
      </div>
    </div>
  );
}