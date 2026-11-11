import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Wallet,
  HandCoins,
  Award,
  BarChart3,
  CreditCard,
  ArrowRightLeft,
  Download,
  FileText,
  Calendar,
  Landmark,
  Search,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { SavingsBarChart } from "@/components/charts/SavingsBarChart";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";

import { getMonthlySavingsReport } from "@/services/savings";
import {
  getMonthlyStatement,
  downloadStatementPdf,
} from "@/services/reports";

import { formatNaira, formatDate, getScoreRating } from "@/utils/format";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const REPORT_TYPES = [
  {
    id: "savings",
    label: "Savings Report",
    icon: BarChart3,
  },
  {
    id: "loan",
    label: "Loan Report",
    icon: Landmark,
  },
  {
    id: "transaction",
    label: "Transaction Report",
    icon: ArrowRightLeft,
  },
];

/*
 * Money-flow tone by transaction category. Withdrawals and loan repayments
 * move money OUT of the member's pocket; savings deposits and loan
 * disbursements move money IN. Product fees (minutes contributions,
 * membership) are shown neutrally — they are neither savings-in nor
 * savings-out, and printing a misleading sign would misstate the accounts.
 */
function moneyTone(tx) {
  const category = tx.category || "";
  if (category === "withdrawal" || category === "loan_repayment") {
    return { sign: "−", className: "text-red-500" };
  }
  if (category === "deposit" || category === "loan_disbursement") {
    return { sign: "+", className: "text-emerald-600" };
  }
  return { sign: "", className: "text-indigo-600" };
}

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "approved") return "text-emerald-600";
  if (s.includes("pending") || s === "processing") return "text-amber-600";
  if (["failed", "rejected", "cancelled", "terminated"].includes(s)) {
    return "text-red-500";
  }
  return "text-gray-400";
}

export function Reports() {
  const navigate = useNavigate();

  const currentDate = new Date();
  const currentMonthValue = currentDate.getMonth() + 1;
  const currentYearValue = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [selectedYear, setSelectedYear] = useState(currentYearValue);

  const [activeTab, setActiveTab] = useState("savings");
  const [isDownloading, setIsDownloading] = useState(false);

  // Transaction-tab filters (status + search) and "show more" paging.
  const [txStatus, setTxStatus] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const [txVisible, setTxVisible] = useState(10);

  // Statement years: the last three years, always ending at the current one.
  const years = [currentYearValue - 2, currentYearValue - 1, currentYearValue];

  // Past months for the quick filter row, most recent first, alongside
  // the "This Month" shortcut which always maps to the current month/year.
  const pastMonths = Array.from({ length: 6 }).reduce((list) => {
    const last = list[list.length - 1] || {
      value: currentMonthValue,
      year: currentYearValue,
    };
    let value = last.value - 1;
    let year = last.year;
    if (value < 1) {
      value = 12;
      year -= 1;
    }
    list.push({ value, year, label: MONTH_LABELS[value - 1] });
    return list;
  }, []);

  // Monthly chart data
  const {
    data: monthlyRes,
    isLoading: loadingMonths,
  } = useAsync(getMonthlySavingsReport, []);

  // Selected month statement
  const {
    data: statementRes,
    isLoading: loadingStatement,
    error: statementError,
    refetch: refetchStatement,
  } = useAsync(
    () =>
      getMonthlyStatement({
        month: selectedMonth,
        year: selectedYear,
      }),
    [selectedMonth, selectedYear]
  );

  const chartData =
    monthlyRes?.months ||
    monthlyRes?.data ||
    (Array.isArray(monthlyRes) ? monthlyRes : []);

  const statement =
    statementRes?.statement ||
    statementRes?.data ||
    statementRes ||
    {};

  // Unified transaction rows (TransactionService shape):
  // { id, type, category, label, amount, direction, status, reference, method, date }
  const transactions = Array.isArray(statement?.transactions)
    ? statement.transactions
    : [];

  // Reset paging whenever the period or filters change.
  const filterKey = `${selectedMonth}-${selectedYear}-${txStatus}-${txSearch}`;
  useEffect(() => {
    setTxVisible(10);
  }, [filterKey]);
  const visibleTransactions = useMemo(() => {
    const query = txSearch.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (txStatus !== "all" && tx.status !== txStatus) return false;
      if (!query) return true;
      return (
        String(tx.label || "").toLowerCase().includes(query) ||
        String(tx.category || "").toLowerCase().includes(query) ||
        String(tx.reference || "").toLowerCase().includes(query)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, txStatus, txSearch, filterKey]);

  // Honest totals for the filtered view: completed money movement only.
  const txTotals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    visibleTransactions.forEach((tx) => {
      if (tx.status !== "completed") return;
      const amount = Number(tx.amount || 0);
      if (tx.category === "deposit" || tx.category === "loan_disbursement") {
        credits += amount;
      }
      if (tx.category === "withdrawal" || tx.category === "loan_repayment") {
        debits += amount;
      }
    });
    return { credits, debits };
  }, [visibleTransactions]);

  /*
   * Backend values
   */
  const totalSaved = Number(
    statement?.savings?.totalSaved ??
      statement?.savings?.totalSavings ??
      0
  );

  const totalDeposits = Number(
    statement?.savings?.totalDeposits ??
      statement?.savings?.totalDeposit ??
      0
  );

  const totalWithdrawals = Number(
    statement?.savings?.totalWithdrawals ??
      statement?.savings?.totalWithdrawal ??
      0
  );

  // Backend-computed net growth (completed money movement only); falls back
  // to the same arithmetic if an older backend is serving.
  const netGrowth = Number(
    statement?.savings?.netGrowth ?? totalDeposits - totalWithdrawals
  );

  const growthRate = Number(
    statement?.savings?.growthRate ?? 0
  );

  const outstandingLoan = Number(
    statement?.loans?.outstandingBalance ?? 0
  );

  const activePrincipal = Number(
    statement?.loans?.principalAmount ?? 0
  );

  // Interest attached to the member's active loan positions.
  const activeInterest = Number(
    statement?.loans?.interestAmount ?? 0
  );

  const activeLoanCount = Number(
    statement?.loans?.activeCount ??
      statement?.loans?.activeLoansCount ??
      0
  );

  const amountPaid = Number(
    statement?.loans?.amountPaid ?? statement?.loans?.totalRepaid ?? 0
  );

  const creditScore = Number(
    statement?.rating?.current ?? 0
  );

  const previousScore = statement?.rating?.previous; // null when no prior month record

  /*
   * Summary cards
   */
  const summaryCards = [
    {
      id: "totalSaved",
      title: "Total Saved",
      value: formatNaira(totalSaved),
      subtext:
        totalSaved === 0 && growthRate === 0
          ? "—"
          : `${growthRate >= 0 ? "↑" : "↓"} ${Math.abs(
              growthRate
            )}%`,
      subtext2: "vs last month",
      icon: Wallet,
      cardBg: "bg-emerald-50/70 border-emerald-100",
      iconBg: "bg-emerald-200/60 text-emerald-700",
      textColor:
        growthRate >= 0
          ? "text-emerald-600"
          : "text-red-500",
    },
    {
      id: "activeLoans",
      title: "Active Loans",
      value: formatNaira(outstandingLoan),
      subtext:
        statement?.loans?.activeCount != null
          ? `${statement.loans.activeCount} Loans`
          : "Outstanding",
      subtext2: "",
      icon: HandCoins,
      cardBg: "bg-indigo-50/70 border-indigo-100",
      iconBg: "bg-indigo-200/60 text-indigo-700",
      textColor: "text-indigo-600",
    },
    {
      id: "netGrowth",
      title: "Net Growth",
      value: formatNaira(netGrowth),
      subtext: "Deposits − withdrawals",
      subtext2: "this month",
      icon: ArrowRightLeft,
      cardBg: "bg-teal-50/70 border-teal-100",
      iconBg: "bg-teal-200/60 text-teal-700",
      textColor:
        netGrowth >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      id: "currentRating",
      title: "Current Rating",
      value:
        statement?.rating?.label ||
        getScoreRating(creditScore).label ||
        creditScore ||
        "N/A",
      subtext:
        statement?.rating?.tier
          ? `Tier: ${statement.rating.tier}`
          : "Credit Score",
      subtext2: "",
      icon: Award,
      cardBg: "bg-cyan-50/70 border-cyan-100",
      iconBg: "bg-cyan-200/60 text-cyan-700",
      textColor: "text-cyan-600",
    },
  ];

  async function handleDownloadPdf() {
    setIsDownloading(true);

    const toastId = toast.loading(
      "Generating your PDF statement..."
    );

    try {
      const blob = await downloadStatementPdf({
        month: selectedMonth,
        year: selectedYear,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SocketMoni_Statement_${MONTH_LABELS[selectedMonth - 1]}_${selectedYear}.pdf`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        "Statement downloaded successfully!",
        {
          id: toastId,
        }
      );
    } catch (error) {
      toast.error(
        error?.message ||
          "Could not download PDF statement",
        {
          id: toastId,
        }
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-slate-50 pb-24 font-sans text-gray-900">
      {/* HEADER */}
      <header
  className="relative px-5 py-4 text-white shadow-lg"
  style={{
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
   background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-lg font-bold tracking-tight">
            Report
          </h1>

          <div className="w-10" />
        </div>
      </header>

      <main className="mt-4 space-y-5 px-4">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-4 gap-2">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                className={`flex flex-col justify-between rounded-2xl border p-2.5 shadow-sm ${card.cardBg}`}
              >
                <div
                  className={`mb-3 flex h-7 w-7 items-center justify-center rounded-full ${card.iconBg}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div>
                  <p className="text-[9px] font-extrabold leading-tight text-gray-800">
                    {card.title}
                  </p>

                  <p className="mt-0.5 text-[11px] font-black text-gray-900 truncate">
                    {card.value}
                  </p>

                  <div className="mt-1.5 text-[8px] leading-tight">
                    <span
                      className={`block font-bold ${card.textColor}`}
                    >
                      {card.subtext}
                    </span>

                    {card.subtext2 && (
                      <span className="block font-medium text-gray-400">
                        {card.subtext2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* STATEMENT ERROR */}
        {statementError && !loadingStatement && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-red-700">
                Could not load this month&apos;s statement
              </p>
              <p className="text-[10px] text-red-500">
                Check your connection and try again.
              </p>
            </div>
            <button
              type="button"
              onClick={refetchStatement}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {/* REPORT TYPE */}
        <section>
          <h2 className="mb-2 text-xs font-extrabold text-gray-900">
            Select Report Type
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = activeTab === type.id;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setActiveTab(type.id)}
                  className={`flex min-h-[96px] flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm"
                      : "border-gray-100 bg-white text-gray-800 shadow-sm hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`mb-2 ${
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="text-[11px] font-bold leading-tight">
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* MONTH FILTER */}
        <div className="rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(currentMonthValue);
                setSelectedYear(currentYearValue);
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                selectedMonth === currentMonthValue &&
                selectedYear === currentYearValue
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              This Month
            </button>

            {pastMonths.map((month) => {
              const isSelected =
                selectedMonth === month.value &&
                selectedYear === month.year;

              return (
                <button
                  key={`${month.year}-${month.value}`}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(month.value);
                    setSelectedYear(month.year);
                  }}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {month.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* YEAR */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />

            <span className="text-xs font-bold">
              Statement Year
            </span>
          </div>

          <select
            value={selectedYear}
            onChange={(event) =>
              setSelectedYear(Number(event.target.value))
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold outline-none"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* SAVINGS */}
        {activeTab === "savings" && (
          <>
            {/* CHART */}
            <section>
              <SectionHeader title="Savings Accumulation Trend" />

              <Card className="rounded-2xl p-4">
                {loadingMonths ? (
                  <LoadingState rows={1} />
                ) : chartData.length === 0 ? (
                  <EmptyState
                    title="No data"
                    description="Start saving to see your growth trend."
                  />
                ) : (
                  <SavingsBarChart data={chartData} />
                )}
              </Card>
            </section>

            {/* SAVINGS REPORT */}
            <section>
              <div className="mb-0.5 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-gray-900">
                  Savings Report
                </h3>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
              <p className="mb-2 text-[10px] font-medium text-gray-400">
                Summary of your savings activities
              </p>

              {loadingStatement ? (
                <LoadingState rows={3} />
              ) : (
                <div className="space-y-3">
                  {/* TOTAL SAVINGS */}
                  <Card className="rounded-2xl p-4">
                    <div className="grid grid-cols-2 divide-x divide-gray-100">
                      <div className="pr-3">
                        <span className="block text-[10px] font-bold text-gray-900">
                          Total Savings
                        </span>

                        <span className="mt-2 block text-sm font-black text-emerald-600">
                          {formatNaira(totalSaved, { decimals: 2 })}
                        </span>

                        <p className="mt-3 text-[9px] font-bold text-gray-400">
                          vs last month{" "}
                          {totalSaved === 0 && growthRate === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span
                              className={
                                growthRate >= 0
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }
                            >
                              {growthRate >= 0 ? "↑" : "↓"}{" "}
                              {Math.abs(growthRate)}%
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2.5 pl-3">
                        <ReportMetric
                          label="Total Deposit"
                          value={formatNaira(totalDeposits, { decimals: 2 })}
                        />

                        <ReportMetric
                          label="Total Withdrawals"
                          value={formatNaira(totalWithdrawals, { decimals: 2 })}
                        />

                        <ReportMetric
                          label="Net Growth"
                          value={formatNaira(netGrowth, { decimals: 2 })}
                          valueClass="text-emerald-600"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* LOAN */}
                  <Card className="flex items-center justify-between rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-600">
                        <CreditCard className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-400">
                          Outstanding Loan Balance
                        </p>

                        <p className="text-lg font-bold text-gray-900">
                          {formatNaira(
                            outstandingLoan
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* CREDIT SCORE */}
                  <Card className="flex items-center gap-4 rounded-2xl p-4">
                    <ProgressRing
                      score={creditScore}
                      size={64}
                      strokeWidth={6}
                    />

                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                        <Award className="h-4 w-4 text-indigo-600" />
                        Socket Credit Score
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Previous Period Score:{" "}
                        <strong>
                          {previousScore != null ? previousScore : "—"}
                        </strong>
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </section>
          </>
        )}

        {/* LOAN REPORT */}
        {activeTab === "loan" && (
          <section>
            <h3 className="mb-2 text-xs font-extrabold text-gray-900">
              Loan &amp; Credit Overview
            </h3>

            <Card className="space-y-3 rounded-2xl p-4">
              <ReportMetric
                label="Active Loan Positions"
                value={activeLoanCount}
              />

              <ReportMetric
                label="Active Principal"
                value={formatNaira(activePrincipal)}
              />

              <ReportMetric
                label="Interest Charge (active loans)"
                value={formatNaira(activeInterest)}
                valueClass="text-amber-600"
              />

              <ReportMetric
                label="Total Paid Off (all loans)"
                value={formatNaira(amountPaid)}
                valueClass="text-emerald-600"
              />

              <ReportMetric
                label="Remaining Balance"
                value={formatNaira(outstandingLoan)}
                valueClass="text-indigo-600"
              />
            </Card>
          </section>
        )}

        {/* TRANSACTION REPORT */}
        {activeTab === "transaction" && (
          <section>
            <h3 className="mb-2 text-xs font-extrabold text-gray-900">
              Period Activity Breakdown
            </h3>

            {/* Status filter chips */}
            <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "completed", label: "Completed" },
                { id: "pending", label: "Pending" },
                { id: "failed", label: "Failed" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setTxStatus(chip.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                    txStatus === chip.id
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <input
                type="text"
                value={txSearch}
                onChange={(event) => setTxSearch(event.target.value)}
                placeholder="Search label or reference…"
                className="w-full bg-transparent text-[11px] font-medium outline-none placeholder:text-gray-300"
              />
              {txSearch && (
                <button
                  type="button"
                  onClick={() => setTxSearch("")}
                  className="text-[10px] font-bold text-gray-400"
                >
                  Clear
                </button>
              )}
            </div>

            <Card className="rounded-2xl p-4">
              {loadingStatement ? (
                <LoadingState rows={3} />
              ) : visibleTransactions.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No transactions"
                  description={
                    transactions.length === 0
                      ? "No transaction history recorded for this period."
                      : "No transactions match the current filters."
                  }
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleTransactions
                      .slice(0, txVisible)
                      .map((tx, index) => {
                        const tone = moneyTone(tx);

                        return (
                          <div
                            key={tx.id || index}
                            className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs last:border-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900">
                                {tx.label ||
                                  String(
                                    tx.category || "Transaction"
                                  ).replace(/_/g, " ")}
                              </p>

                              <p className="truncate text-[10px] text-gray-400">
                                {tx.date
                                  ? formatDate(tx.date, "MMM dd, yyyy")
                                  : "—"}
                                {tx.reference
                                  ? ` • ${tx.reference}`
                                  : ""}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p
                                className={`font-bold ${tone.className}`}
                              >
                                {tone.sign}
                                {formatNaira(tx.amount)}
                              </p>

                              <span
                                className={`text-[9px] font-bold uppercase ${statusTone(
                                  tx.status
                                )}`}
                              >
                                {tx.status || "completed"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* View totals + show-more */}
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-gray-500">
                        In view ({visibleTransactions.length})
                      </span>
                      <span className="space-x-2">
                        <span className="text-emerald-600">
                          +{formatNaira(txTotals.credits)}
                        </span>
                        <span className="text-red-500">
                          −{formatNaira(txTotals.debits)}
                        </span>
                      </span>
                    </div>

                    {txVisible < visibleTransactions.length && (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => setTxVisible((n) => n + 10)}
                      >
                        Show more (
                        {visibleTransactions.length - txVisible}{" "}
                        remaining)
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          </section>
        )}

        {/* DOWNLOAD */}
        <Button
          variant="outline"
          fullWidth
          icon={Download}
          isLoading={isDownloading}
          onClick={handleDownloadPdf}
        >
          Download PDF Statement ({selectedMonth}/
          {selectedYear})
        </Button>
      </main>

    </div>
  );
}

function ReportMetric({
  label,
  value,
  valueClass = "text-gray-900",
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-[10px] font-bold text-gray-900">
        {label}
      </span>

      <span
        className={`text-[11px] font-extrabold ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}