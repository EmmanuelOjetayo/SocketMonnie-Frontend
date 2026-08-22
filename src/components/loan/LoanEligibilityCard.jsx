import { useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { formatNaira } from "@/utils/format";

export function LoanEligibilityCard({ eligibility, socketScore = 95, onViewDetails }) {
  const [showModal, setShowModal] = useState(false);

  if (!eligibility) return null;

  const {
    isEligible,
    netSavings,
    maxLoanAmount,
    isConsistent,
    meetsSavingsThreshold,
    monthsCount,
    minSavings,
    minMonths,
  } = eligibility;

  const getScoreLabel = (score) => {
    if (score >= 80) return { label: "Excellent", color: "text-[#10B981]" };
    if (score >= 60) return { label: "Good", color: "text-blue-400" };
    if (score >= 40) return { label: "Fair", color: "text-amber-400" };
    return { label: "Needs Work", color: "text-rose-400" };
  };

  const scoreInfo = getScoreLabel(socketScore);
  const displayAmount = maxLoanAmount ?? netSavings ?? 200000;

  return (
    <>
      {/* Dark Navy Hero Card Matching Mockup */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#122271] p-6 text-white shadow-xl">
        <div className="flex items-start justify-between">
          {/* Left Column: Eligibility Info */}
          <div className="space-y-1 pr-2">
            <h3 className="text-base font-bold text-white/95">Loan Eligibility</h3>
            <p className="text-xs font-medium text-white/75">
              {isEligible ? "You are eligible for a loan" : "You are not eligible for a loan"}
            </p>

            <div className="pt-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {formatNaira(displayAmount)}
              </span>
            </div>

            <p className="text-[11px] text-white/60 font-medium pt-1 max-w-[150px] leading-tight">
              Based on your savings and socket score
            </p>
          </div>

          {/* Vertical Separator Line */}
          <div className="w-[1px] bg-white/15 self-stretch my-1 mx-2" />

          {/* Right Column: Socket Score Circular Ring */}
          <div className="flex flex-col items-center justify-center pl-2">
            <span className="text-xs font-semibold text-white/80 mb-2">Socket Score</span>

            <div className="relative size-20 flex items-center justify-center">
              <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="transition-all duration-1000 ease-out"
                  strokeDasharray={`${socketScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="url(#score-gradient)"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <defs>
                  <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-2xl font-black text-white tracking-tighter">
                {socketScore}
              </span>
            </div>

            <span className={`text-xs font-bold mt-1.5 ${scoreInfo.color}`}>
              {scoreInfo.label}
            </span>
          </div>
        </div>

        {/* View Details Action Button */}
        <div className="mt-6 pt-1">
          <button
            type="button"
            onClick={() => {
              setShowModal(true);
              if (onViewDetails) onViewDetails();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all active:scale-[0.99]"
          >
            <span>View Eligibility Details</span>
            <ArrowRight className="size-4 text-white" />
          </button>
        </div>
      </div>

      {/* Dynamic Breakdown Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#122271]" />
                <h3 className="text-base font-bold text-gray-900">Eligibility Breakdown</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  {monthsCount >= (minMonths ?? 6) ? (
                    <CheckCircle2 className="size-5 text-[#10B981] shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-rose-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-gray-800">
                    Consistent Savings Period
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {monthsCount ?? 0} / {minMonths ?? 6} mos
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  {meetsSavingsThreshold ? (
                    <CheckCircle2 className="size-5 text-[#10B981] shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-rose-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-gray-800">
                    Minimum Net Savings
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {formatNaira(netSavings ?? 0)}
                </span>
              </div>
            </div>

            {!isEligible && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-bold text-amber-950">How to unlock higher borrowing limits:</p>
                <ul className="list-disc pl-4 space-y-1 text-amber-800">
                  {!isConsistent && (
                    <li>Maintain monthly savings contributions consistently.</li>
                  )}
                  {!meetsSavingsThreshold && (
                    <li>
                      Deposit {formatNaira((minSavings ?? 70000) - (netSavings ?? 0))} more into your savings account.
                    </li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-[#122271] text-white text-xs font-bold rounded-xl active:scale-[0.99]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}