import { formatNaira } from "@/utils/format";

export function LoanSummaryCard({ loan }) {
  if (!loan) return null;

  const principalAmount = loan.principalAmount ?? 150000;
  const remainingBalance = loan.remainingBalance ?? 50000;
  
  const nextPaymentItem = loan.installments?.find((i) => i.status !== "paid");
  const nextPaymentAmount = nextPaymentItem?.amountDue ?? 50000;

  const totalRepayable = loan.totalRepayable || principalAmount;
  const amountPaid = loan.amountPaid ?? (totalRepayable - remainingBalance);
  const progressPercent = totalRepayable > 0 
    ? Math.round((amountPaid / totalRepayable) * 100) 
    : 80;

  const loanId = loan.loanId || loan._id?.slice(-8).toUpperCase() || "SM20260307";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#E8F8F0] text-[#10B981]">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-6h6M9 3h6a2 2 0 012 2v1a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              {loan.loanType ? loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) : "Cooperative"} Loan
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Loan ID: {loanId}</p>
          </div>
        </div>
        <span className="rounded-lg bg-[#E8F8F0] px-3 py-1 text-xs font-semibold text-[#10B981]">
          Active
        </span>
      </div>

      {/* Financials Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div>
          <p className="text-[11px] font-medium text-gray-400">Loan Amount</p>
          <p className="text-sm font-black text-gray-900 mt-0.5">{formatNaira(principalAmount)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-400">Outstanding Balance</p>
          <p className="text-sm font-black text-gray-900 mt-0.5">{formatNaira(remainingBalance)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-400">Next Payment</p>
          <p className="text-sm font-black text-[#10B981] mt-0.5">{formatNaira(nextPaymentAmount)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pt-1">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer Details matching screenshot */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <div className="flex items-center gap-1 font-semibold">
          <span className="text-gray-500">Paid:</span>
          <span className="text-[#10B981] font-bold">{formatNaira(amountPaid)}</span>
          <span className="text-gray-400">({progressPercent}%)</span>
        </div>
        <div className="font-semibold text-gray-600">
          Total: <span className="text-gray-900 font-bold">{formatNaira(totalRepayable)}</span>
        </div>
      </div>
    </div>
  );
}