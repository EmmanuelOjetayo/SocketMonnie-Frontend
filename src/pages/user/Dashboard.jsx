import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  HandCoins, 
  Coins, 
  Calendar, 
  Gift, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  ArrowUpRight 
} from "lucide-react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TransactionRow } from "@/components/cards/TransactionRow";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getSavingsSummary, getSavingsHistory } from "@/services/savings";
import { getLoanEligibility, getActiveLoan } from "@/services/loans";
import { formatNaira, getScoreRating } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { getNotifications } from "@/services/notifications";
import { getPendingGuarantorRequests } from "@/services/guarantor";
import { GuarantorVerify } from "@/pages/user/GuarantorVerify";


const QUICK_ACTIONS = [
  { to: ROUTES.SAVINGS_DEPOSIT, icon: HandCoins, label: "Save Money" },
  { to: ROUTES.LOAN_APPLY, icon: Coins, label: "Apply Loan" },
  { to: ROUTES.LOANS, icon: Calendar, label: "Pay Loan" },
  { to: ROUTES.PROFILE, icon: Gift, label: "Referral" },
  { to: ROUTES.REPORTS, icon: FileText, label: "Statement" },
];

function CheckItem({ ok, label }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] leading-tight py-0.5">
      {ok ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="size-3.5 shrink-0 text-red-500" />
      )}
      <span className={ok ? "text-[#090f24] font-semibold" : "text-red-500 font-semibold"}>
        {label}
      </span>
    </div>
  );
}

/**
 * Normalizes transaction types & statuses into label, sign, and direction for UI display
 */
function getTxDisplayProps(tx) {
  const normType = (tx?.type || "").toLowerCase();
  const normStatus = (tx?.status || "").toLowerCase();
  const rawAmount = Number(tx?.amount || tx?.value || 0);

  let label = "Transaction";
  let direction = "credit";
  let amount = rawAmount;

  if (normStatus === "pending" || normStatus === "pending_approval") {
    label = "Pending Transaction";
  } else if (normStatus === "failed" || normStatus === "rejected") {
    label = "Failed Transaction";
  } else if (normType === "withdrawal" || normType === "debit") {
    label = "Withdrawal";
    direction = "debit";
    amount = -Math.abs(rawAmount);
  } else if (normType === "loan_repayment") {
    label = "Loan Repayment";
    direction = "credit";
    amount = Math.abs(rawAmount);
  } else if (normType === "deposit" || normType === "credit") {
    label = "Savings Deposit";
    direction = "credit";
    amount = Math.abs(rawAmount);
  }

  return { label, direction, amount };
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  // Separate Async Data Fetching matching Savings.jsx pattern
  const { data: summaryRes, isLoading: loadingSummary } = useAsync(getSavingsSummary, []);
  const { data: historyRes, isLoading: loadingHistory } = useAsync(
    () => getSavingsHistory({ page: 1, limit: 50 }),
    []
  );
  const { data: eligibilityRes, isLoading: loadingEligibility } = useAsync(getLoanEligibility, []);
  const { data: activeLoanRes } = useAsync(getActiveLoan, []);
  const { data: notificationsRes } = useAsync(getNotifications, []);
const { data: pendingGuarantorRes, refetch: refreshPendingGuarantors } = useAsync(getPendingGuarantorRequests, []);

  const pendingGuarantorRequest = pendingGuarantorRes?.pendingRequests?.[0] || null;


  // Extract Summary & History List robustly
  const summary = summaryRes?.summary || summaryRes?.data || summaryRes || {};
  const historyList = useMemo(() => {
    if (Array.isArray(historyRes?.data?.history)) return historyRes.data.history;
    if (Array.isArray(historyRes?.history)) return historyRes.history;
    if (Array.isArray(historyRes?.data)) return historyRes.data;
    if (Array.isArray(historyRes?.items)) return historyRes.items;
    if (Array.isArray(historyRes)) return historyRes;
    return [];
  }, [historyRes]);

  const totalSaved = summary?.totalSaved ?? 0;
  const streakMonths = summary?.streakMonths ?? 0;
  const eligibility = eligibilityRes?.eligibility || eligibilityRes || {};
  const activeLoan = activeLoanRes?.loan || activeLoanRes || null;
  const unreadCount = notificationsRes?.unreadCount || 0;
  // Calculate total savings accumulated specifically in the current calendar month
  const monthSavings = useMemo(() => {
    // 1. If backend explicitly provides a distinct monthSavings value, use it
    if (typeof summary?.monthSavings === "number" && summary?.monthSavings !== totalSaved && summary?.monthSavings > 0) {
      return summary.monthSavings;
    }
    if (typeof summary?.monthlyContributed === "number" && summary?.monthlyContributed > 0) {
      return summary.monthlyContributed;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return historyList.reduce((acc, tx) => {
      const rawDate = tx.date || tx.createdAt || tx.created_at || tx.timestamp || tx.$createdAt;
      if (!rawDate) return acc;

      const txDate = new Date(rawDate);
      if (isNaN(txDate.getTime())) return acc;

      const isThisMonth = 
        txDate.getFullYear() === currentYear && 
        txDate.getMonth() === currentMonth;

      const numAmount = Number(tx.amount || tx.value || 0);
      const lowerStatus = (tx.status || "").toLowerCase();
      const lowerType = (tx.type || "").toLowerCase();

      // Verify status is completed/approved
      const isSuccessful = !tx.status || lowerStatus === "successful" || lowerStatus === "completed" || lowerStatus === "approved";

      // Match all possible positive payment flows
      const isDeposit = 
        lowerType === "deposit" || 
        lowerType === "credit" || 
        lowerType === "loan_repayment" ||
        tx.direction === "credit" || 
        (numAmount > 0 && lowerType !== "withdrawal" && lowerType !== "debit");

      if (isThisMonth && isDeposit && isSuccessful) {
        return acc + numAmount;
      }
      return acc;
    }, 0);
  }, [summary, historyList, totalSaved]);

  // Socket Score & Dynamic Rating
  const userScore = user?.socketScore ?? 0;
  const { label: scoreLabel } = getScoreRating(userScore);

  // Eligibility Checks
  const kycSubmitted = !!user?.documentUrl;
  const kycApproved = user?.kycStatus === "approved";
  const bankVerified = user?.bankDetails?.verified === true;
  const bankAccountSet = !!user?.bankDetails?.accountNumber;
  const hasTransactionPin = user?.isPinSet === true;
  const meetsThreshold = !!eligibility?.meetsSavingsThreshold;

  const actions = [...QUICK_ACTIONS];

  // CTA Link Logic
  let nextAction = null;
  if (!kycSubmitted) {
    nextAction = { text: "Upload KYC Document", route: ROUTES.PROFILE };
  } else if (!kycApproved) {
    nextAction = { text: "KYC Pending Review", route: ROUTES.PROFILE };
  } else if (!bankAccountSet) {
    nextAction = { text: "Add Bank Details", route: ROUTES.PROFILE };
  } else if (!bankVerified) {
    nextAction = { text: "Verify Bank Account", route: ROUTES.PROFILE };
  } else if (!hasTransactionPin) {
    nextAction = { text: "Set Transaction PIN", route: ROUTES.PROFILE };
  } else if (!eligibility?.isEligible) {
    nextAction = {
      text: "Deposit ₦5k/mo (₦70k total)",
      route: ROUTES.SAVINGS_DEPOSIT,
    };
  } else if (!activeLoan) {
    nextAction = {
      text: "Apply for a Loan",
      route: ROUTES.LOANS,
    };
  }

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* Top Header */}
      <TopHeader variant="brand" user={user}  unreadCount={unreadCount}/>

      {/* Main Container */}
      <div className="px-4 sm:px-6 space-y-4 pt-3">
        
        {/* Total Savings Balance Card */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md"
           style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#dee3f9]">Total Savings</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-[#dee3f9] hover:text-white transition-colors p-1"
            >
              {showBalance ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </div>

          <div className="mt-1.5">
            {loadingSummary ? (
              <div className="h-8 w-40 animate-pulse rounded bg-white/20" />
            ) : (
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {showBalance ? formatNaira(totalSaved) : "••••••••"}
              </h2>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-1 text-xs text-[#dee3f9]">
            <span>This Month:</span>
            <span className="flex items-center font-semibold text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              {showBalance ? formatNaira(monthSavings) : "••••"}
            </span>
          </div>
        </div>

        {/* Recent Transactions Card (Displays scrollable history list) */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#090f24] tracking-tight">Recent Transactions</h3>
            <Link to={ROUTES.REPORTS} className="text-[11px] font-semibold text-[#3b5bdb] hover:underline">
              See All
            </Link>
          </div>
          <hr className="border-[#dee3f9] mb-2" />

          {loadingHistory ? (
            <LoadingState rows={3} />
          ) : historyList.length === 0 ? (
            <EmptyState title="No transactions yet" />
          ) : (
            <div className="max-h-[160px] overflow-y-auto pr-1 divide-y divide-[#dee3f9]/50 scrollbar-thin scrollbar-thumb-gray-200">
              {historyList.map((tx, idx) => {
                const { label, direction, amount } = getTxDisplayProps(tx);
                const rawDate = tx.date || tx.createdAt || tx.created_at || tx.$createdAt;
                const formattedDate = rawDate ? rawDate.split("T")[0] : "";

                return (
                  <TransactionRow
                    key={tx.id || tx._id || tx.$id || idx}
                    label={label}
                    amount={amount}
                    direction={direction}
                    date={formattedDate}
                  />
                );
              })}
            </div>
          )}
        </Card>

        {/* Horizontal Quick Actions Grid */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.to)}
                className="flex min-w-[95px] flex-col items-center justify-center rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm active:scale-95 transition-transform shrink-0"
              >
                <Icon className="size-4 text-[#090f24] mb-1.5" />
                <span className="text-[10px] font-semibold text-[#090f24] whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Grid: Loan Eligibility & Socket Score */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          
          {/* Scrollable Loan Eligibility Card */}
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm flex flex-col justify-between h-[210px]">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-extrabold text-[#090f24] tracking-tight">
                  Loan Eligibility
                </h4>
                {!loadingEligibility && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      eligibility?.isEligible 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {eligibility?.isEligible ? "Eligible" : "Not Eligible"}
                  </span>
                )}
              </div>

              {/* Scrollable Conditions Checklist */}
              <div className="max-h-[105px] overflow-y-auto pr-1 space-y-1 my-1 scrollbar-thin scrollbar-thumb-gray-200">
                <CheckItem ok={kycSubmitted && kycApproved} label="KYC Document" />
                <CheckItem ok={bankAccountSet && bankVerified} label="Verified Bank" />
                <CheckItem ok={hasTransactionPin} label="PIN Created" />
                <CheckItem ok={meetsThreshold} label="Min Savings Target" />
              </div>
            </div>

            {nextAction && (
              <div className="pt-2 border-t border-[#dee3f9]">
                <Link
                  to={nextAction.route}
                  className="text-[10px] font-bold text-[#3b5bdb] hover:underline block truncate text-center"
                >
                  {nextAction.text} &rarr;
                </Link>
              </div>
            )}
          </Card>

          {/* Socket Score Card with ProgressRing */}
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm flex flex-col items-center justify-between text-center h-[210px]">
            <div className="w-full text-left">
              <h4 className="text-[11px] font-extrabold text-[#090f24] tracking-tight">
                Socket Score
              </h4>
            </div>

            {/* Custom Progress Ring gauge */}
            <div className="my-auto">
              <ProgressRing score={userScore} size={88} strokeWidth={8} />
            </div>

            {/* Grade & Tier Badge directly beneath ring */}
            <div className="flex flex-col items-center gap-1 w-full pt-1.5 border-t border-[#dee3f9]/60">
              <div className="flex items-center gap-1 justify-center">
                <Badge variant="brand" className="text-[9px] font-bold px-2 py-0.5">
                  {user?.tier || scoreLabel || "Tier 1"}
                </Badge>
                {streakMonths > 0 && (
                  <Badge variant="success" className="text-[9px] font-bold px-1.5 py-0.5">
                    {streakMonths}m Streak
                  </Badge>
                )}
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Guarantor Verification Post-Login Prompt */}
      {pendingGuarantorRequest && (
        <GuarantorVerify
          pendingRequest={pendingGuarantorRequest}
          isModal={true}
          onClose={() => refreshPendingGuarantors()}
          onRefresh={() => refreshPendingGuarantors()}
        />
      )}
    </div>
  );
}