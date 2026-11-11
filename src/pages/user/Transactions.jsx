import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Filter,
  PiggyBank,
  Clock3,
  CreditCard,
  Users,
  Landmark,
  Search,
  X,
} from "lucide-react";

import { useAsync } from "@/hooks/useAsync";
import { getTransactions } from "@/services/transactions";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { formatNaira, formatDate } from "@/utils/format";
import { canonicalReceiptStatus } from "@/utils/receiptData";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "savings", label: "Savings" },
  { key: "minute", label: "Minutes" },
  { key: "membership", label: "Membership" },
  { key: "loan", label: "Loan" },
];

const STATUS_FILTERS = [
  { key: "all", label: "Any status" },
  { key: "successful", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
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

const PAGE_SIZE = 20;

/** Icon per transaction category — matches the receipt design language. */
function iconFor(transaction) {
  const category = String(transaction?.category || "").toLowerCase();
  const type = String(transaction?.type || "").toLowerCase();

  if (category === "withdrawal") return ArrowUpRight;
  if (category === "deposit" || type === "savings") return PiggyBank;
  if (category === "minute_contribution" || type === "minute") return Clock3;
  if (category === "membership_fee" || type === "membership") return Users;
  if (category === "loan_repayment" || category === "loan_disbursement" || type === "loan") {
    return Landmark;
  }
  return CreditCard;
}

const STATUS_STYLES = {
  successful: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  failed: "bg-rose-50 text-rose-600",
};

const STATUS_LABELS = {
  successful: "Successful",
  pending: "Pending",
  failed: "Failed",
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
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const years = useMemo(buildYears, []);

  // Debounce the search so typing does not hammer the API.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [type, status, month, year, search]);

  const { data, isLoading } = useAsync(
    () => getTransactions({ month, year, type, search, page, limit: PAGE_SIZE }),
    [type, status, month, year, search, page]
  );

  const transactions = data?.transactions || [];
  const pagination = data?.pagination || {};
  const total = pagination.total ?? transactions.length;
  const totalPages = pagination.totalPages || 1;

  // The backend already filters by type/month/year/search; the status
  // filter is applied here on the canonical status of each record.
  const visible = useMemo(() => {
    if (status === "all") return transactions;
    return transactions.filter(
      (tx) => canonicalReceiptStatus(tx.status) === status
    );
  }, [transactions, status]);

  const hasFilters =
    type !== "all" ||
    status !== "all" ||
    Boolean(month) ||
    Boolean(year) ||
    Boolean(search);

  const clearFilters = () => {
    setType("all");
    setStatus("all");
    setMonth("");
    setYear("");
    setSearchInput("");
    setSearch("");
  };

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
        {/* SEARCH */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reference or transaction…"
            className="w-full rounded-xl border border-[#dee3f9] bg-white py-2.5 pl-9 pr-9 text-[12px] font-medium text-[#090f24] shadow-sm outline-none focus:border-[#3b5bdb]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] transition hover:text-[#090f24]"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className="mt-3 rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm space-y-3">
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

          {/* Status chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                  status === f.key
                    ? "bg-[#090f24] text-white shadow-sm"
                    : "bg-[#f2f4fd] text-[#6b7280] hover:bg-[#e7eaf8]"
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

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold text-[#3b5bdb]"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* RESULT COUNT */}
        <div className="mb-2 mt-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#6b7280]">
            {isLoading
              ? "Loading…"
              : `${visible.length} transaction${visible.length === 1 ? "" : "s"}`}
            {!isLoading && total !== visible.length && status !== "all"
              ? ` of ${total}`
              : ""}
          </p>
          {!isLoading && page < totalPages && (
            <p className="text-[10px] font-medium text-[#9ca3af]">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {/* LIST */}
        {isLoading ? (
          <LoadingState rows={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description={
              hasFilters
                ? "Try adjusting your filters to see more of your activity."
                : "Your financial activity will appear here once you make a payment."
            }
          />
        ) : (
          <div className="divide-y divide-[#dee3f9]/60 rounded-2xl border border-[#bdc8f3]/40 bg-white shadow-sm">
            {visible.map((tx, idx) => {
              const Icon = iconFor(tx);
              const isCredit = tx.direction !== "debit";
              const canonical = canonicalReceiptStatus(tx.status);

              return (
                <Link
                  key={tx.id || idx}
                  to={`${ROUTES.TRANSACTIONS}/${tx.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#f7f9ff]"
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      isCredit
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-500"
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#090f24]">
                      {tx.label}
                    </p>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      <p className="text-[10px] font-medium text-[#9ca3af]">
                        {formatDate(tx.date, "d MMM yyyy · h:mm a")}
                      </p>

                      {tx.reference && (
                        <>
                          <span className="text-[#d1d5db]">•</span>
                          <p className="truncate font-mono text-[9px] font-semibold text-[#9ca3af]">
                            {tx.reference}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-[13px] font-bold",
                        isCredit ? "text-emerald-600" : "text-rose-500"
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatNaira(Math.abs(tx.amount))}
                    </p>

                    <span
                      className={cn(
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold",
                        STATUS_STYLES[canonical] || "bg-gray-100 text-gray-500"
                      )}
                    >
                      {STATUS_LABELS[canonical] || String(tx.status || "").toUpperCase()}
                    </span>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-[#c7cbe0]" />
                </Link>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!isLoading && page < totalPages && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="mt-3 w-full rounded-xl border border-[#bdc8f3]/40 bg-white py-2.5 text-[12px] font-bold text-[#3b5bdb] shadow-sm transition hover:bg-[#f7f9ff]"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
