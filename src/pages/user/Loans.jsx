import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  ClipboardList, 
  Banknote,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle, Wallet, HandCoins, Star, Award
} from "lucide-react";
import toast from "react-hot-toast";
import { TopHeader } from "@/components/navigation/TopHeader";
import { LoanEligibilityCard } from "@/components/loan/LoanEligibilityCard";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { 
  getLoanEligibility, 
  getActiveLoan, 
  getLoanHistory
} from "@/services/loans";
import { formatNaira, formatDate } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

export function Loans() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: eligibility, isLoading: loadingEligibility } = useAsync(getLoanEligibility, []);
  const { data: activeLoan, isLoading: loadingActiveLoan } = useAsync(getActiveLoan, []);
  const { data: loanHistory, isLoading: loadingHistory } = useAsync(getLoanHistory, []);

  const isEligible = eligibility?.isEligible ?? false;

  // Normalized active loan status
  const loanStatus = (activeLoan?.status || "").trim().toLowerCase();
  const hasActiveLoan = loanStatus === "active";
  const isWaitingForGuarantors = loanStatus === "waiting_guarantor";

  // Calculations for Active Loan Card & Progress Bar
  const principalAmount = activeLoan?.principalAmount ?? 0;
  const remainingBalance = activeLoan?.remainingBalance ?? 0;
  const totalRepayable = activeLoan?.totalRepayable || 0;
  const amountPaid = activeLoan?.amountPaid ?? Math.max(0, totalRepayable - remainingBalance);
  const progressPercent = totalRepayable > 0 
    ? Math.round((amountPaid / totalRepayable) * 100) 
    : 0;

  const nextPaymentItem = activeLoan?.installments?.find((i) => i.status !== "paid");
  const nextPaymentAmount = nextPaymentItem?.amountDue ?? 0;
  const nextPaymentDueDate = nextPaymentItem?.dueDate;
  const loanId = activeLoan?.loanNumber || activeLoan?._id?.slice(-8).toUpperCase() || "N/A";

  const displayHistory = loanHistory?.loans?.slice(0, 3) || [];

  // Calculate metrics based on loan schedules/repayment data
const calculateLoanMetrics = (loan) => {
  if (!loan) return { paymentsMade: 0, totalPayments: 0, onTimePayments: 0, onTimePercentage: 0, nextAmount: 0, dueDays: null, progressPercentage: 0 };

  const schedules = loan.installments || [];
  const totalPayments = schedules.length;
  
  // Paid schedules
  const paidSchedules = schedules.filter((s) => s.status === "paid" || s.isPaid);
  const paymentsMade = paidSchedules.length;

  // On-time payments
  const onTimePayments = paidSchedules.filter((s) => {
    const paidAt = new Date(s.paidAt || s.updatedAt);
    const dueDate = new Date(s.dueDate);
    return paidAt <= dueDate;
  }).length;

  const onTimePercentage = paymentsMade > 0 ? Math.round((onTimePayments / paymentsMade) * 100) : 0;

  // Next Pending Payment
  const nextSchedule = schedules.find((s) => s.status !== "paid");
  const nextAmount = nextSchedule?.amountDue || 0;

  let dueDays = null;
  if (nextSchedule?.dueDate) {
    const today = new Date();
    const dueDate = new Date(nextSchedule.dueDate);
    const diffTime = dueDate - today;
    dueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Total Progress
  const totalAmount = loan.totalRepayable || 0;
  const paidAmount = loan.amountPaid || paidSchedules.reduce((acc, s) => acc + (s.amountDue || 0), 0);
  const progressPercentage = Math.min(100, Math.round((paidAmount / totalAmount) * 100));

  return {
    paymentsMade,
    totalPayments,
    onTimePayments,
    onTimePercentage,
    nextAmount,
    dueDays,
    progressPercentage,
  };
};

const metrics = calculateLoanMetrics(activeLoan); // pass active or selected loan
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-24 font-sans text-gray-900">
      {/* Top Header with Back Arrow */}
      <div className="sticky top-0 z-10 bg-[#F4F6F9]/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-gray-200/50">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-10 rounded-full bg-white border border-gray-100 shadow-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Loans</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 space-y-5 mt-3">
        {(loadingEligibility || loadingActiveLoan || loadingHistory) ? (
          <LoadingState rows={3} />
        ) : (
          <>
            {/* 1. Loan Eligibility Card */}
            <LoanEligibilityCard 
              eligibility={eligibility} 
              socketScore={user?.socketScore || 0}
            />

            {/* 2. Quick Actions */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                
                {/* Repay Loan vs Apply Loan Logic */}
                <button
                  type="button"
                  onClick={() => {
                    if (isWaitingForGuarantors) {
                      navigate(ROUTES.LOAN_APPLY);
                    } else if (hasActiveLoan) {
                      navigate(ROUTES.LOAN_REPAY);
                    } else if (isEligible) {
                      navigate(ROUTES.LOAN_APPLY || "/loan-apply");
                    } else {
                      toast.error("You are not currently eligible to apply for a loan.");
                    }
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E8F8F0] text-[#10B981] transition-transform group-active:scale-95">
                    <Calendar className="size-5" />
                  </div>
                  <span className="text-center text-xs font-bold text-gray-800 leading-tight">
                    {isWaitingForGuarantors ? "Resume Loan" : hasActiveLoan ? "Repay Loan" : "Apply Loan"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOAN_TRACKER || "/loan-tracker")}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E8F8F0] text-[#10B981] transition-transform group-active:scale-95">
                    <Clock className="size-5" />
                  </div>
                  <span className="text-center text-xs font-bold text-gray-800 leading-tight">
                    Loan tracker
                  </span>
                </button>

                <Link 
                  to={ROUTES.LOAN_HISTORY || "/loan-history"} 
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E8F8F0] text-[#10B981] transition-transform group-active:scale-95">
                    <ClipboardList className="size-5" />
                  </div>
                  <span className="text-center text-xs font-bold text-gray-800 leading-tight">
                    Loan History
                  </span>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
    {/* Card 1: Payment Made */}
    <div className="bg-[#E4F3E6] p-4 rounded-2xl flex flex-col justify-between border border-emerald-100 shadow-sm">
      <div className="w-9 h-9 bg-[#69C990] rounded-full flex items-center justify-center text-white mb-3">
        <Wallet className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">Payment Made</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.paymentsMade}</h3>
        <p className="text-[11px] font-medium text-gray-500 mt-2">of {metrics.totalPayments}</p>
      </div>
    </div>

    {/* Card 2: On Time Payment */}
    <div className="bg-[#E6E8FD] p-4 rounded-2xl flex flex-col justify-between border border-indigo-100 shadow-sm">
      <div className="w-9 h-9 bg-[#868DFB] rounded-full flex items-center justify-center text-white mb-3">
        <HandCoins className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">On Time Payment</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.onTimePayments}</h3>
        <p className="text-[11px] font-medium text-gray-500 mt-2">{metrics.onTimePercentage}%</p>
      </div>
    </div>

    {/* Card 3: Next Payment */}
    <div className="bg-[#CEECE9] p-4 rounded-2xl flex flex-col justify-between border border-teal-100 shadow-sm">
      <div className="w-9 h-9 bg-[#48BDB3] rounded-full flex items-center justify-center text-white mb-3">
        <Star className="w-4 h-4 fill-current" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">Next Payment</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">
          ₦{metrics.nextAmount.toLocaleString()}
        </h3>
        <p className="text-[11px] font-medium text-teal-800 mt-2">
          {metrics.dueDays !== null ? `Due in ${metrics.dueDays} days` : "No pending due"}
        </p>
      </div>
    </div>

    {/* Card 4: Total Progress */}
    <div className="bg-[#DDF3F8] p-4 rounded-2xl flex flex-col justify-between border border-sky-100 shadow-sm">
      <div className="w-9 h-9 bg-[#50CCE2] rounded-full flex items-center justify-center text-white mb-3">
        <Award className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">Total Progress</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">{metrics.progressPercentage}%</h3>
        <p className="text-[11px] font-bold text-[#147B95] mt-2">
          {metrics.progressPercentage === 100 ? "Completed" : "In Progress"}
        </p>
      </div>
    </div>
  </div>
            </div>

            {/* 3. Active Loan Section */}
            {hasActiveLoan && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-gray-900">Active Loan</h2>

                  <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-full bg-[#E8F8F0] text-[#10B981]">
                          <Banknote className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight">
                            {activeLoan.loanType ? activeLoan.loanType.charAt(0).toUpperCase() + activeLoan.loanType.slice(1) : "Cooperative"} Loan
                          </h3>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">Loan ID: {loanId}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          loanStatus === "active"
                            ? "bg-[#E8F8F0] text-[#10B981]"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {loanStatus
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>

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

                    <div className="pt-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

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
                </div>

                {/* Next Payment Card */}
                <div className="rounded-2xl bg-[#E8EEFF] p-5 shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#7C98EE] text-white shadow-sm">
                    <Calendar className="size-6" />
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900">Next Payment</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">
                      {formatNaira(nextPaymentAmount)}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      {nextPaymentDueDate ? formatDate(nextPaymentDueDate, "dd MMM yyyy") : "No payment scheduled"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigate(ROUTES.LOAN_REPAY);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#7C98EE] hover:bg-[#6B88DC] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}

            {/* 4. Recent Loan Application List */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-gray-900">Recent Loan Application</h2>
              <div className="space-y-2.5">
                {displayHistory.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center space-y-2">
                    <div className="flex justify-center text-gray-300">
                      <ClipboardList className="size-8" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No loan applications yet.
                    </p>
                  </div>
                ) : (
                  displayHistory.map((app) => {
                    const status = (app.status || "")
                      .trim()
                      .toLowerCase();

                    const isApproved =
                      status === "active" ||
                      status === "completed";

                    const isDeclined =
                      status === "rejected" ||
                      status === "defaulted_60_days" ||
                      status === "restricted_90_days" ||
                      status === "recovery_120_days";

                    const statusLabel =
                      status.length > 0
                        ? status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                        : "Pending Review";

                    return (
                      <div
                        key={app._id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-11 items-center justify-center rounded-2xl ${
                              isDeclined
                                ? "bg-rose-50 text-rose-500"
                                : isApproved
                                ? "bg-[#E8F8F0] text-[#10B981]"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="size-5" />
                            ) : isDeclined ? (
                              <AlertCircle className="size-5" />
                            ) : (
                              <HelpCircle className="size-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 leading-snug">
                              {app.loanType.toUpperCase() || "Cooperative Loan"}
                            </h4>
                            <p className="text-[11px] text-gray-400 font-medium">
                              Applied on {formatDate(app.createdAt || app.appliedAt, "d MMMM yyyy")}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-black text-gray-900">
                            {formatNaira(app.amount || app.principalAmount)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isApproved
                                ? "bg-[#E8F8F0] text-[#10B981]"
                                : isDeclined
                                ? "bg-rose-50 text-rose-500"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}