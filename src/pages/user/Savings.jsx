import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  HandCoins, 
  ArrowDownLeft, 
  FileText, 
  Gift, 
  Flame, 
  ChevronRight,
  Wallet,
  ArrowUpRightFromSquare,
  Target
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TransactionRow } from "@/components/cards/TransactionRow";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { getSavingsSummary, getSavingsHistory } from "@/services/savings";
import { getLoanEligibility } from "@/services/loans";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

export function Savings() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [page] = useState(1);

  // Data Fetching
  const { data: summaryRes, isLoading: loadingSummary } = useAsync(getSavingsSummary, []);
  const { data: eligibility } = useAsync(getLoanEligibility, []);
  const { data: historyRes, isLoading: loadingHistory } = useAsync(
    () => getSavingsHistory({ page, limit: 50 }),
    [page]
  );

  // Extract Summary & History
  const summary = summaryRes?.summary || summaryRes?.data || summaryRes || {};
  const historyList = historyRes?.data || historyRes?.history || (Array.isArray(historyRes) ? historyRes : []);

  // Total Savings Balance
  const totalSaved = summary?.totalSaved ?? 0;
  const monthlyContributed = summary?.monthSavings ?? summary?.monthlyContributed ?? 0;

  // 1. Money In: Total Saved / Total Deposit Amount
  const moneyIn = useMemo(() => {
    if (summary?.moneyIn !== undefined) return summary.moneyIn;
    if (summary?.totalSaved !== undefined) return summary.totalSaved;
    return historyList
      .filter((tx) => tx.type === "deposit" || tx.direction === "credit")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [summary, historyList]);

  // 2. Money Out: Total Withdrawn
  const moneyOut = useMemo(() => {
    if (summary?.moneyOut !== undefined) return summary.moneyOut;
    if (summary?.totalWithdrawals !== undefined) return summary.totalWithdrawals;
    return historyList
      .filter((tx) => tx.type === "withdrawal" || tx.direction === "debit")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [summary, historyList]);

  // 3. Dynamic 6-Month Rolling Streak Calculation
  const streakMonths = useMemo(() => {
    if (summary?.streakMonths !== undefined) return Math.min(summary.streakMonths, 6);
    if (!historyList.length) return 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const activeMonths = new Set();

    historyList.forEach((tx) => {
      const isDeposit = tx.type === "deposit" || tx.direction === "credit";
      const isCompleted = !tx.status || tx.status === "completed" || tx.status === "successful";

      if (isDeposit && isCompleted) {
        const txDate = new Date(tx.createdAt || tx.date);
        if (txDate >= sixMonthsAgo) {
          const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
          activeMonths.add(monthKey);
        }
      }
    });

    return Math.min(activeMonths.size, 6);
  }, [summary?.streakMonths, historyList]);

  // Loan Eligibility Progress
  const monthsCount = eligibility?.monthsCount ?? streakMonths;
  const minMonths = eligibility?.minMonths ?? 6;
  const minSavings = eligibility?.minSavings ?? 70000;
  const monthsProgress = minMonths > 0 ? Math.min((monthsCount / minMonths) * 100, 100) : 0;
  const savingsProgress = minSavings > 0 ? Math.min((totalSaved / minSavings) * 100, 100) : 0;
  const isEligible = eligibility?.isEligible ?? false;

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]" >
      {/* 1. Header with Money In / Out Cashflow Pills */}
      <header 
        className="relative px-5 pt-4 pb-7 rounded-b-[24px] shadow-md text-white"
         style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
      >
        <div className="flex items-center justify-between mb-4" >
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="size-5 text-white" />
          </button>
          <h1 className="text-base font-bold tracking-tight text-white">My Savings</h1>
          <div className="w-5" />
        </div>

        {/* Dual Cashflow Pills */}
        <div className="grid grid-cols-2 gap-2.5 mt-1" >
          {/* Money In (Total Saved) */}
          <div className="bg-white rounded-2xl p-3 flex items-center gap-2.5 shadow-sm border border-[#bdc8f3]/40">
            <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Wallet className="size-4 text-emerald-600" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-medium text-gray-500 leading-tight">Money In</span>
              <span className="text-xs font-extrabold text-[#090f24] truncate">
                {showBalance ? formatNaira(moneyIn) : "••••"}
              </span>
            </div>
          </div>

          {/* Money Out (Total Withdrawn) */}
          <div className="bg-white rounded-2xl p-3 flex items-center gap-2.5 shadow-sm border border-[#bdc8f3]/40">
            <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <ArrowUpRightFromSquare className="size-4 text-red-600" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-medium text-gray-500 leading-tight">Money Out</span>
              <span className="text-xs font-extrabold text-[#090f24] truncate">
                {showBalance ? formatNaira(moneyOut) : "••••"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="px-4 sm:px-6 space-y-4 pt-3">
        
        {/* 2. Total Savings Hero Card */}
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
              {showBalance ? formatNaira(monthlyContributed) : "••••"}
            </span>
          </div>
        </div>

        {/* Loan Eligibility Progress Card */}
        {!isEligible && (
          <Card className="p-3.5 border border-amber-200 bg-amber-50/80 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-900">Loan Eligibility Progress</p>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-amber-700 font-medium">Savings Months</span>
                  <span className="font-bold text-amber-900">{monthsCount} / {minMonths} months</span>
                </div>
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${monthsProgress}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-amber-700 font-medium">Minimum Savings</span>
                  <span className="font-bold text-amber-900">{formatNaira(totalSaved)} / {formatNaira(minSavings)}</span>
                </div>
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${savingsProgress}%` }} />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 3. Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <Link
            to={ROUTES.SAVINGS_DEPOSIT}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-sm border border-[#bdc8f3]/40 active:scale-95 transition-transform"
          >
            <HandCoins className="size-4 text-[#090f24] mb-1.5" />
            <span className="text-[10px] font-semibold text-[#090f24] whitespace-nowrap">
              Save Money
            </span>
          </Link>

          <Link
            to={ROUTES.SAVINGS_WITHDRAW || "/savings/withdraw"}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-sm border border-[#bdc8f3]/40 active:scale-95 transition-transform"
          >
            <ArrowDownLeft className="size-4 text-[#090f24] mb-1.5" />
            <span className="text-[10px] font-semibold text-[#090f24] whitespace-nowrap">
              Withdraw
            </span>
          </Link>

          <Link
            to={ROUTES.REPORTS}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-sm border border-[#bdc8f3]/40 active:scale-95 transition-transform"
          >
            <FileText className="size-4 text-[#090f24] mb-1.5" />
            <span className="text-[10px] font-semibold text-[#090f24] whitespace-nowrap">
              Reports
            </span>
          </Link>

          <Link
            to={ROUTES.PROFILE}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-sm border border-[#bdc8f3]/40 active:scale-95 transition-transform"
          >
            <Gift className="size-4 text-[#090f24] mb-1.5" />
            <span className="text-[10px] font-semibold text-[#090f24] whitespace-nowrap">
              Refer
            </span>
          </Link>
        </div>

        {/* 4. Recent Transactions Card (Displays scrollable history list) */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#090f24] tracking-tight">Recent Transaction</h3>
            <Link to={ROUTES.REPORTS} className="text-[11px] font-semibold text-[#3b5bdb] hover:underline">
              See All
            </Link>
          </div>
          <hr className="border-[#dee3f9] mb-2" />

          {loadingHistory ? (
            <LoadingState rows={3} />
          ) : historyList.length === 0 ? (
            <EmptyState title="No savings history yet" />
          ) : (
            <div className="max-h-[160px] overflow-y-auto pr-1 divide-y divide-[#dee3f9]/50 scrollbar-thin scrollbar-thumb-gray-200">
              {historyList.map((tx) => (
                <TransactionRow
                  key={tx.id || tx._id}
                  label={
                    tx.type === "deposit"
                      ? "Savings Deposit"
                      : tx.type === "withdrawal"
                      ? "Withdrawal"
                      : "Transaction"
                  }
                  amount={tx.type === "deposit" ? tx.amount : -tx.amount}
                  direction={tx.type === "deposit" ? "credit" : "debit"}
                  date={tx.date || tx.createdAt?.split("T")[0]}
                />
              ))}
            </div>
          )}
        </Card>

        {/* 5. Savings Streak Card (Max 6 Months) */}
        <div 
          onClick={() => navigate(ROUTES.PROFILE)}
          className="rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
           style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Flame className="size-5 text-[#ffb020] fill-[#ffb020]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">Savings Streak</h4>
              <p className="text-xs font-extrabold text-[#dee3f9] mt-0.5">
                {streakMonths} / 6 {streakMonths === 1 ? "Month" : "Months"}
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-[#dee3f9]" />
        </div>

      </div>
    </div>
  );
}