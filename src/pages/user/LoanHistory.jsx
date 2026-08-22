import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, Star, XSquare, Search, HandCoins, CalendarDays } from "lucide-react";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { getLoanHistory } from "@/services/loans";
import { formatNaira, formatDate } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

const STATUS_OPTIONS = [
  ["", "All Statuses"],
  ["waiting_guarantor", "Waiting for Guarantors"],
  ["pending_review", "Pending Review"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["rejected", "Rejected"],
  ["defaulted_60_days", "Defaulted"],
];

function titleCase(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDate(loan) {
  const finalInstallment = loan.installments?.[loan.installments.length - 1];
  return finalInstallment?.dueDate || loan.completedAt || loan.createdAt;
}

function statusClasses(status) {
  if (status === "active" || status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status.includes("default") || status === "rejected") return "bg-red-100 text-red-600";
  return "bg-amber-100 text-amber-700";
}

function iconClasses(loan) {
  if (loan.loanType === "emergency") return "bg-red-50 text-red-500 border-red-100";
  if (loan.status === "completed") return "bg-indigo-50 text-indigo-600 border-indigo-100";
  return "bg-emerald-50 text-emerald-600 border-emerald-100";
}

export function LoanHistory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useAsync(
    () => getLoanHistory({ page: 1, limit: 50, status: statusFilter }),
    [statusFilter]
  );

  const loans = data?.loans || [];
  const stats = data?.stats || { totalLoans: 0, completed: 0, active: 0, defaulted: 0 };
  const filteredLoans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return loans;
    return loans.filter((loan) => [loan.loanNumber, loan._id, loan.loanType, loan.status, loan.principalAmount, loan.createdAt]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [loans, searchQuery]);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-24 font-sans text-gray-900">
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
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>

    <h1 className="text-lg font-bold tracking-tight">Loans History</h1>

    <div className="w-10" />
  </div>
</header>

      <main className="mt-4 space-y-5 px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <HistoryMetric icon={FileText} label="Total Loans" value={stats.totalLoans} tone="emerald" />
          <HistoryMetric icon={CheckCircle2} label="Completed" value={stats.completed} tone="indigo" footer={stats.totalLoans ? `${Math.round((stats.completed / stats.totalLoans) * 100)}%` : "0%"} />
          <HistoryMetric icon={Star} label="Active" value={stats.active} tone="teal" />
          <HistoryMetric icon={XSquare} label="Defaulted" value={stats.defaulted} tone="red" />
        </div>

        <div className="space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-gray-400" />
            <input type="search" placeholder="Search date, amount, loan ID or loan type" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-medium shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-700 outline-none focus:border-indigo-500">
            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <section>
          <h2 className="mb-3 text-base font-extrabold">Loan List</h2>
          {isLoading ? <LoadingState rows={4} /> : filteredLoans.length === 0 ? (
            <EmptyState icon={FileText} title="No loans found" description={searchQuery ? "Try adjusting your search." : "You have not applied for any loans yet."} />
          ) : (
            <div className="space-y-3">
              {filteredLoans.map((loan) => {
                const status = loan.status || "pending_review";
                const nextInstallment = loan.installments?.find((item) => item.status !== "paid");
                const isCompleted = status === "completed";
                const isDefaulted = status.includes("default");
                const thirdMetricLabel = isCompleted ? "Total Repaid" : isDefaulted ? "Overdue" : "Next Payment";
                const thirdMetricValue = isCompleted ? loan.totalRepayable : isDefaulted ? loan.remainingBalance : nextInstallment?.amountDue || 0;
                return (
                  <Link to={ROUTES.LOAN_DETAILS.replace(":loanId", loan._id)} key={loan._id} className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-md transition hover:shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${iconClasses(loan)}`}>{loan.loanType === "emergency" ? <CalendarDays className="h-5 w-5" /> : <HandCoins className="h-5 w-5" />}</div>
                        <div className="min-w-0"><h3 className="truncate text-sm font-extrabold capitalize">{loan.loanType || "Cooperative"} Loan</h3><p className="truncate text-[11px] font-semibold text-gray-400">Loan ID: {loan.loanNumber || loan._id}</p></div>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusClasses(status)}`}>{titleCase(status)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
                      <HistoryValue label="Amount" value={formatNaira(loan.principalAmount)} />
                      <HistoryValue label="Outstanding" value={formatNaira(loan.remainingBalance)} valueClass={isDefaulted ? "text-red-500" : ""} />
                      <HistoryValue label={thirdMetricLabel} value={formatNaira(thirdMetricValue)} valueClass={isCompleted ? "text-emerald-600" : isDefaulted ? "text-red-500" : "text-amber-500"} />
                      <HistoryValue label={isCompleted ? "Completed On" : "Due Date"} value={getDate(loan) ? formatDate(getDate(loan), "dd MMM yyyy") : "N/A"} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function HistoryMetric({ icon: Icon, label, value, footer = "All time", tone }) {
  const tones = { emerald: "bg-emerald-100 text-emerald-600", indigo: "bg-indigo-100 text-indigo-600", teal: "bg-teal-100 text-teal-600", red: "bg-red-100 text-red-600" };
  return <div className="flex min-h-28 flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-md"><div><div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full ${tones[tone]}`}><Icon className="h-4 w-4" /></div><p className="text-[10px] font-semibold leading-tight text-gray-600">{label}</p><p className="mt-1 text-lg font-extrabold">{value}</p></div><p className="text-[10px] font-semibold text-gray-400">{footer}</p></div>;
}

function HistoryValue({ label, value, valueClass = "" }) {
  return <div><p className="truncate text-[10px] font-semibold text-gray-500">{label}</p><p className={`mt-1 truncate text-xs font-extrabold text-gray-900 ${valueClass}`}>{value}</p></div>;
}
