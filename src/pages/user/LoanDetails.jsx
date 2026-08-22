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
  const { data: schedule, isLoading: loadingSchedule } = useAsync(
    () => getRepaymentSchedule(loanId),
    [loanId]
  );

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

        {loan.status === "active" && loan.remainingBalance > 0 && (
          <Button fullWidth onClick={() => navigate(ROUTES.LOANS)}>
            Make Repayment
          </Button>
        )}
      </div>
    </div>
  );
}