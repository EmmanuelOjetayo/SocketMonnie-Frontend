import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Filter } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getTransactions } from "@/services/transactions";
import { TransactionRow } from "@/components/cards/TransactionRow";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { formatNaira, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "savings", label: "Savings" },
  { key: "minute", label: "Minutes" },
  { key: "membership", label: "Membership" },
  { key: "loan", label: "Loan" },
];

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const LIMIT = 50;

const STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  pending_approval: "bg-amber-50 text-amber-600",
  failed: "bg-rose-50 text-rose-600",
  rejected: "bg-rose-50 text-rose-600",
};

function buildYears() {
  const current = new Date().getFullYear();
  const years = [{ value: "", label: "All Years" }];
  for (let y = current; y >= current - 5; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export function Transactions() {
  const navigate = useNavigate();
  const [type, setType] = useState("all");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const years = useMemo(buildYears, []);

  const { data, isLoading } = useAsync(
    () => getTransactions({ month, year, type, page: 1, limit: LIMIT }),
    [type, month, year]
  );

  const transactions = data?.transactions || [];
  const total = data?.pagination?.total ?? transactions.length;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#dee3f9]/20 pb-10 font-sans text-[#090f24]">
      {/* HEADER */}
      <header
        className="relative px-4 pb-6 pt-3 text-white shadow-lg"
        style={{
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-sm font-bold tracking-tight">Transactions</h1>
          <div className="size-9" />
        </div>
        <p className="mt-2 text-center text-[11px] text-white/70">
          Savings · Minutes · Membership · Loan
        </p>
      </header>

      <div className="px-4 pt-4">
        {/* FILTERS */}
        <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm space-y-3">
          {/* Type chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <Filter className="size-3.5 shrink-0 text-[#3b5bdb]" />
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setType(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                  type === f.key
                    ? "bg-[#3b5bdb] text-white shadow-sm"
                    : "bg-[#eef1fd] text-[#3b5bdb] hover:bg-[#e3e8fb]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Month / Year */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#dee3f9] bg-[#f7f9ff] px-3 py-2 pr-8 text-[12px] font-medium text-[#090f24] outline-none focus:border-[#3b5bdb]"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#3b5bdb]" />
            </div>
            <div className="relative flex-1">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#dee3f9] bg-[#f7f9ff] px-3 py-2 pr-8 text-[12px] font-medium text-[#090f24] outline-none focus:border-[#3b5bdb]"
              >
                {years.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#3b5bdb]" />
            </div>
          </div>
        </div>

        {/* RESULT COUNT */}
        <div className="mb-2 mt-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#6b7280]">
            {isLoading ? "Loading…" : `${total} transaction${total === 1 ? "" : "s"}`}
          </p>
          <p className="text-[10px] font-medium text-[#9ca3af]">Limit {LIMIT}</p>
        </div>

        {/* LIST */}
        {isLoading ? (
          <LoadingState rows={6} />
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions found" />
        ) : (
          <div className="divide-y divide-[#dee3f9]/60 rounded-2xl border border-[#bdc8f3]/40 bg-white shadow-sm">
            {transactions.map((tx, idx) => (
              <div key={tx.id || idx} className="relative">
                <TransactionRow
                  label={tx.label}
                  amount={tx.direction === "debit" ? -Math.abs(tx.amount) : Math.abs(tx.amount)}
                  direction={tx.direction}
                  date={tx.date}
                />
                {tx.status && tx.status !== "completed" ? (
                  <span
                    className={cn(
                      "absolute right-3 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold",
                      STATUS_STYLES[tx.status] || "bg-gray-100 text-gray-500"
                    )}
                  >
                    {tx.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                ) : null}
                {tx.reference ? (
                  <p className="px-4 pb-2 text-[9px] font-medium text-[#9ca3af]">
                    Ref: {tx.reference}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
