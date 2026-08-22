import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, HandCoins, Star, Ribbon, Download, Minus, Clock } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getActiveLoan, getRepaymentSchedule } from "@/services/loans";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNaira, formatDate } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

function daysUntil(date) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date) - new Date()) / 86400000));
}

export function LoansTracker() {
  const navigate = useNavigate();
  const { data: loan, isLoading: loadingLoan } = useAsync(getActiveLoan, []);
  const { data: scheduleData, isLoading: loadingSchedule } = useAsync(
    () => (loan?._id ? getRepaymentSchedule(loan._id) : Promise.resolve({ schedule: [] })),
    [loan?._id]
  );

  if (loadingLoan || (loan && loadingSchedule)) {
    return <div className="min-h-screen bg-slate-50 px-5 pt-8"><LoadingState rows={5} /></div>;
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 pt-8">
        <EmptyState title="No active loan" description="Apply for a loan to view its repayment tracker." />
        <button type="button" onClick={() => navigate(ROUTES.LOANS)} className="mt-4 w-full rounded-xl bg-[#090F47] py-3 text-xs font-bold text-white">Back to Loans</button>
      </div>
    );
  }

  const installments = scheduleData?.schedule || loan.installments || [];
  const paidInstallments = installments.filter((item) => item.status === "paid");
  const nextPayment = installments.find((item) => item.status !== "paid");
  const totalRepayable = Number(loan.totalRepayable || 0);
  const paidAmount = Number(loan.amountPaid || 0);
  const progress = totalRepayable ? Math.min(100, Math.round((paidAmount / totalRepayable) * 100)) : 0;
  const dueDays = daysUntil(nextPayment?.dueDate);
  const status = loan.status?.replace(/_/g, " ") || "Unknown";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-12 font-sans text-gray-900">
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
      Loans Tracker
    </h1>

    <div className="w-10" />
  </div>
</header>


     <main className="mt-4 space-y-5 px-4">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm font-extrabold">Loan Overview</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold capitalize text-emerald-700">{status}</span></div>
          <div className="mb-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/70 text-emerald-600"><HandCoins className="h-6 w-6" /></div><div><h2 className="text-base font-extrabold capitalize">{loan.loanType || "Cooperative"} Loan</h2><p className="text-xs font-medium text-gray-400">Loan ID: {loan.loanNumber || loan._id}</p></div></div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-left"><div><p className="text-[10px] font-semibold text-gray-500">Loan Amount</p><p className="mt-0.5 text-sm font-extrabold">{formatNaira(loan.principalAmount)}</p></div><div><p className="text-[10px] font-semibold text-gray-500">Outstanding</p><p className="mt-0.5 text-sm font-extrabold">{formatNaira(loan.remainingBalance)}</p></div><div><p className="text-[10px] font-semibold text-gray-500">Next Payment</p><p className="mt-0.5 text-sm font-extrabold text-emerald-600">{formatNaira(nextPayment?.amountDue || 0)}</p></div></div>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="flex justify-between text-xs font-bold text-gray-700"><span>Paid: <span className="text-emerald-600">{formatNaira(paidAmount)}</span> <span className="font-normal text-gray-500">({progress}%)</span></span><span className="text-gray-500">Total: {formatNaira(totalRepayable)}</span></div>
        </section>

        <div className="grid grid-cols-4 gap-2">
          <Metric icon={FileText} label="Payments Made" value={paidInstallments.length} footer={`of ${installments.length}`} tone="emerald" />
          <Metric icon={HandCoins} label="On Time" value={paidInstallments.filter((item) => item.paidAt && item.dueDate && new Date(item.paidAt) <= new Date(item.dueDate)).length} footer="Payments" tone="indigo" />
          <Metric icon={Star} label="Next Payment" value={formatNaira(nextPayment?.amountDue || 0)} footer={dueDays === null ? "No pending due" : `Due in ${dueDays} days`} tone="teal" />
          <Metric icon={Ribbon} label="Progress" value={`${progress}%`} footer={progress === 100 ? "Completed" : "In Progress"} tone="sky" />
        </div>

       <section>
  <h3 className="mb-2 text-base font-bold">Upcoming Payment</h3>
  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
    {nextPayment ? (
      <>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-16 shrink-0 flex-col items-center overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex w-full items-center justify-center bg-emerald-600 py-1">
              <span className="text-[10px] font-bold uppercase text-white">
                {formatDate(nextPayment.dueDate, "MMM")}
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-gray-900">
                {formatDate(nextPayment.dueDate, "dd")}
              </span>
              <span className="text-[10px] font-semibold text-gray-400">
                {formatDate(nextPayment.dueDate, "yyyy")}
              </span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-3 divide-x divide-emerald-200/70">
            <div className="pr-3">
              <p className="text-[11px] font-semibold text-gray-500">Amount</p>
              <p className="text-sm font-extrabold text-gray-900">{formatNaira(nextPayment.amountDue)}</p>
            </div>
            <div className="px-3">
              <p className="text-[11px] font-semibold text-gray-500">Principal</p>
              <p className="text-sm font-extrabold text-gray-900">
                {formatNaira(nextPayment.principalDue ?? nextPayment.principal ?? 0)}
              </p>
            </div>
            <div className="pl-3">
              <p className="text-[11px] font-semibold text-gray-500">Interest</p>
              <p className="text-sm font-extrabold text-gray-900">
                {formatNaira(nextPayment.interestDue ?? nextPayment.interest ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {/* <button
            type="button"
            onClick={() => navigate(ROUTES.LOANS)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
          >
            Make Payment
          </button> */}
          <span className="text-xs font-bold text-emerald-700 ml-auto">
            {dueDays === null ? "" : `Due in ${dueDays} days`}
          </span>
        </div>
      </>
    ) : (
      <p className="text-xs font-semibold text-emerald-700">No upcoming payment.</p>
    )}
  </div>
</section>
        <section><h3 className="mb-2 text-base font-bold">Payment Schedule</h3><div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-md"><div className="grid grid-cols-12 border-b border-gray-100 pb-3 text-[10px] font-bold text-gray-500"><span className="col-span-1">#</span><span className="col-span-4">Due Date</span><span className="col-span-3">Amount</span><span className="col-span-2 text-center">Status</span><span className="col-span-2 text-right">Action</span></div><div className="divide-y divide-gray-100">{installments.map((item, index) => { const paid = item.status === "paid"; return <div key={item.installmentNumber || index} className="grid grid-cols-12 items-center py-3 text-xs"><span className="col-span-1 font-bold text-gray-500">{item.installmentNumber || index + 1}</span><span className="col-span-4 font-bold">{formatDate(item.dueDate)}</span><span className="col-span-3 font-bold">{formatNaira(item.amountDue)}</span><span className="col-span-2 text-center"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{paid ? "Paid" : item.status}</span></span><span className="col-span-2 flex justify-end">{paid ? <button type="button" title="Download receipt" className="text-indigo-600"><Download className="h-4 w-4" /></button> : <Minus className="h-4 w-4 text-gray-500" />}</span></div>; })}</div></div></section>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value, footer, tone }) {
  const colors = { emerald: "bg-emerald-100/60 text-emerald-700", indigo: "bg-indigo-100/60 text-indigo-700", teal: "bg-teal-100/60 text-teal-700", sky: "bg-sky-100/60 text-sky-700" };
  return <div className={`flex min-h-28 flex-col justify-between rounded-2xl border border-white p-3 ${colors[tone]}`}><div><Icon className="mb-2 h-4 w-4" /><p className="text-[10px] font-bold leading-tight text-gray-700">{label}</p><p className="mt-1 text-sm font-extrabold text-gray-900">{value}</p></div><p className="mt-2 text-[9px] font-semibold text-gray-500">{footer}</p></div>;
}
