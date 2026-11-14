import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HandCoins,
  CalendarDays,
  CheckCircle2,
  Clock3,
  TrendingUp,
  FileText,
  ReceiptText,
  Wallet,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAsync } from "@/hooks/useAsync";
import { getActiveLoan, getRepaymentSchedule } from "@/services/loans";
import { formatNaira, formatDate } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

function daysUntil(date) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date) - new Date()) / 86400000));
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  const styles =
    value === "active"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : value === "completed" || value === "paid"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : value === "overdue" ||
        value.includes("default") ||
        value.includes("restricted") ||
        value.includes("recovery")
      ? "bg-rose-50 text-rose-700 border border-rose-200"
      : "bg-amber-50 text-amber-700 border border-amber-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold capitalize",
        styles
      )}
    >
      {titleCase(value || "Unknown")}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone = "brand" }) {
  const tones = {
    brand: "bg-[#eef1fd] text-[#3b5bdb]",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
  };

  return (
    <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
      <div className={cn("mb-3 flex size-9 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-4.5" />
      </div>
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-base font-extrabold text-[#090f24]">{value}</p>
      {hint && <p className="mt-1 text-[10px] font-medium text-gray-400">{hint}</p>}
    </Card>
  );
}

function SkeletonBlock({ className }) {
  return <div className={cn("animate-pulse rounded-xl bg-gray-100", className)} />;
}

export function LoansTracker() {
  const navigate = useNavigate();

  const { data: loan, isLoading: loadingLoan } = useAsync(getActiveLoan, []);
  const { data: scheduleData, isLoading: loadingSchedule } = useAsync(
    () => (loan?._id ? getRepaymentSchedule(loan._id) : Promise.resolve({ schedule: [] })),
    [loan?._id]
  );

  const installments = useMemo(() => {
    const list = scheduleData?.schedule || loan?.installments;
    return Array.isArray(list) ? list : [];
  }, [scheduleData, loan]);

  const isLoading = loadingLoan || (Boolean(loan?._id) && loadingSchedule);

  const derived = useMemo(() => {
    const paidInstallments = installments.filter((item) => item.status === "paid");
    const nextPayment = installments.find((item) => item.status !== "paid");
    const totalRepayable = Number(loan?.totalRepayable || 0);
    const paidAmount = Number(loan?.amountPaid || 0);
    const progress = totalRepayable
      ? Math.min(100, Math.max(0, Math.round((paidAmount / totalRepayable) * 100)))
      : 0;
    const dueDays = daysUntil(nextPayment?.dueDate);
    const onTime = paidInstallments.filter(
      (item) => item.paidAt && item.dueDate && new Date(item.paidAt) <= new Date(item.dueDate)
    ).length;

    return {
      paidInstallments,
      nextPayment,
      totalRepayable,
      paidAmount,
      progress,
      dueDays,
      onTime,
    };
  }, [installments, loan]);

  const headerSubtitle = loan
    ? `${titleCase(loan.loanType || "Cooperative")} loan · ${titleCase(loan.status || "active")}`
    : "Track your loan repayments";

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      <TopHeader
        variant="page"
        title="Loan Tracker"
        subtitle={headerSubtitle}
        showBack
      />

      <div className="space-y-4 px-4 pt-3 sm:px-6">
        {isLoading ? (
          <>
            <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <SkeletonBlock className="size-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-36" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
              </div>
              <SkeletonBlock className="h-2.5 w-full rounded-full" />
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-28 rounded-2xl" />
              <SkeletonBlock className="h-28 rounded-2xl" />
              <SkeletonBlock className="h-28 rounded-2xl" />
              <SkeletonBlock className="h-28 rounded-2xl" />
            </div>
            <SkeletonBlock className="h-40 rounded-2xl" />
          </>
        ) : !loan ? (
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#eef1fd] text-[#3b5bdb]">
                <ReceiptText className="size-7" />
              </div>
              <h2 className="text-base font-extrabold text-[#090f24]">No active loan to track</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                When you have an active loan, you’ll see your repayment progress, next
                payment, and full schedule here.
              </p>

              <div className="mt-5 w-full space-y-2.5">
                <Button
                  variant="primary"
                  fullWidth
                  icon={Wallet}
                  onClick={() => navigate(ROUTES.LOAN_APPLY || ROUTES.LOANS)}
                >
                  Apply for a loan
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate(ROUTES.LOANS)}
                >
                  Back to Loans
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Loan overview */}
            <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <HandCoins className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-[#090f24] truncate">
                      {titleCase(loan.loanType || "Cooperative")} Loan
                    </h2>
                    <p className="text-[11px] font-medium text-gray-400 truncate">
                      Loan ID: {loan.loanNumber || loan._id}
                    </p>
                  </div>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400">Loan amount</p>
                  <p className="mt-0.5 text-sm font-extrabold text-[#090f24]">
                    {formatNaira(loan.principalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400">Outstanding</p>
                  <p className="mt-0.5 text-sm font-extrabold text-[#090f24]">
                    {formatNaira(loan.remainingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400">Next payment</p>
                  <p className="mt-0.5 text-sm font-extrabold text-emerald-600">
                    {formatNaira(derived.nextPayment?.amountDue || 0)}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-gray-500">
                    Paid: <span className="text-emerald-600">{formatNaira(derived.paidAmount)}</span>
                  </span>
                  <span className="text-gray-400">{derived.progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${derived.progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] font-medium text-gray-400">
                  Total repayable:{" "}
                  <span className="font-semibold text-[#090f24]">
                    {formatNaira(derived.totalRepayable)}
                  </span>
                </p>
              </div>
            </Card>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={FileText}
                label="Payments made"
                value={`${derived.paidInstallments.length} of ${installments.length || 0}`}
                hint={installments.length ? "Installments completed" : "No schedule yet"}
                tone="brand"
              />
              <MetricCard
                icon={BadgeCheck}
                label="On-time payments"
                value={String(derived.onTime)}
                hint={
                  derived.paidInstallments.length
                    ? `${Math.round((derived.onTime / derived.paidInstallments.length) * 100)}% of paid`
                    : "No payments yet"
                }
                tone="emerald"
              />
              <MetricCard
                icon={CalendarDays}
                label="Next payment"
                value={formatNaira(derived.nextPayment?.amountDue || 0)}
                hint={
                  derived.dueDays === null
                    ? "No pending due"
                    : derived.dueDays === 0
                    ? "Due today"
                    : `Due in ${derived.dueDays} day${derived.dueDays === 1 ? "" : "s"}`
                }
                tone="amber"
              />
              <MetricCard
                icon={TrendingUp}
                label="Total progress"
                value={`${derived.progress}%`}
                hint={derived.progress === 100 ? "Completed" : "In progress"}
                tone="sky"
              />
            </div>

            {/* Upcoming payment */}
            <section className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#090f24]">Upcoming payment</h3>
              <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                {derived.nextPayment ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
                        <div className="flex w-full items-center justify-center bg-emerald-600 py-1">
                          <span className="text-[10px] font-bold uppercase text-white">
                            {formatDate(derived.nextPayment.dueDate, "MMM")}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col items-center justify-center">
                          <span className="text-lg font-extrabold leading-none text-[#090f24]">
                            {formatDate(derived.nextPayment.dueDate, "dd")}
                          </span>
                          <span className="mt-0.5 text-[9px] font-semibold text-gray-400">
                            {formatDate(derived.nextPayment.dueDate, "yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-400">Amount due</p>
                        <p className="text-xl font-extrabold text-[#090f24]">
                          {formatNaira(derived.nextPayment.amountDue)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                          {derived.dueDays === null
                            ? ""
                            : derived.dueDays === 0
                            ? "Due today"
                            : `Due in ${derived.dueDays} day${derived.dueDays === 1 ? "" : "s"}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f7f9ff] p-3">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400">Principal</p>
                        <p className="text-sm font-bold text-[#090f24]">
                          {formatNaira(
                            derived.nextPayment.principalDue ?? derived.nextPayment.principal ?? 0
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400">Interest</p>
                        <p className="text-sm font-bold text-[#090f24]">
                          {formatNaira(
                            derived.nextPayment.interestDue ?? derived.nextPayment.interest ?? 0
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      icon={Wallet}
                      onClick={() => navigate(ROUTES.LOAN_REPAY)}
                    >
                      Make payment
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <p className="text-sm font-bold text-[#090f24]">No upcoming payment</p>
                    <p className="mt-1 text-xs text-gray-500">
                      You’re all caught up on this loan.
                    </p>
                  </div>
                )}
              </Card>
            </section>

            {/* Payment schedule */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#090f24]">Payment schedule</h3>
                {installments.length > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400">
                    {installments.length} installment{installments.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm">
                {installments.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Clock3 className="mb-2 size-6 text-gray-300" />
                    <p className="text-sm font-semibold text-[#090f24]">No schedule available</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Your repayment schedule will appear here once it’s ready.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {installments.map((item, index) => {
                      const paid = item.status === "paid";
                      const isNext = !paid && derived.nextPayment === item;
                      const statusLabel = paid ? "Paid" : titleCase(item.status || "Pending");

                      return (
                        <div
                          key={item.installmentNumber || item._id || index}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-3",
                            paid
                              ? "border-emerald-100 bg-emerald-50/40"
                              : isNext
                              ? "border-[#bdc8f3] bg-[#f7f9ff]"
                              : "border-[#eef1fd] bg-white"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                              paid
                                ? "bg-emerald-100 text-emerald-700"
                                : isNext
                                ? "bg-[#3b5bdb] text-white"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {item.installmentNumber || index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-[#090f24]">
                              {formatNaira(item.amountDue)}
                            </p>
                            <p className="text-[10px] font-medium text-gray-500">
                              Due {formatDate(item.dueDate, "MMM dd, yyyy")}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                paid
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.status === "overdue"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {statusLabel}
                            </span>
                            {isNext && (
                              <span className="text-[9px] font-semibold text-[#3b5bdb]">
                                Next due
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </section>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                fullWidth
                icon={Wallet}
                onClick={() => navigate(ROUTES.LOAN_REPAY)}
              >
                Repay loan
              </Button>
              <Button
                variant="outline"
                fullWidth
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate(ROUTES.LOANS)}
              >
                Loan overview
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}