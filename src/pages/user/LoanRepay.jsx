import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, HandCoins, Building2, CreditCard, QrCode, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getActiveLoan, getRepaymentSchedule } from "@/services/loans";
import { initiateLoanRepayment, verifyLoanRepayment } from "@/services/payments";
import { calculatePaystackFee } from "@/utils/paystackFee";
import { formatNaira, formatDate } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

const MEMBERSHIP_FEE_AMOUNT = 1000;
const QUICK_AMOUNTS = [1000, 5000, 10000, 20000];
const PAYABLE_STATUSES = ["active", "warning_30_days", "defaulted_60_days", "restricted_90_days"];

export function LoanRepay() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const membershipUnpaid = !user?.membershipFeePaid;
  const { data: loanData, isLoading: loadingLoan } = useAsync(getActiveLoan, []);
  const loan = loanData?.loan || loanData;
  const { data: scheduleData, isLoading: loadingSchedule } = useAsync(
    () => (loan?._id ? getRepaymentSchedule(loan._id) : Promise.resolve({ schedule: [] })),
    [loan?._id]
  );

  if (loadingLoan || (loan && loadingSchedule)) return <div className="min-h-screen bg-slate-50 px-5 pt-8"><LoadingState rows={5} /></div>;
  if (!loan || !PAYABLE_STATUSES.includes(loan.status)) return <div className="min-h-screen bg-slate-50 px-5 pt-8 text-center text-sm text-gray-500">No payable active loan found.</div>;

  const installments = scheduleData?.schedule || loan.installments || [];
  const nextPayment = installments.find((item) => item.status !== "paid");
  const paidAmount = Number(loan.amountPaid || 0);
  const totalRepayable = Number(loan.totalRepayable || 0);
  const progress = totalRepayable ? Math.min(100, Math.round((paidAmount / totalRepayable) * 100)) : 0;
  const paymentAmount = Number(amount) || 0;
  const { fee, totalPayable } = calculatePaystackFee(paymentAmount);

  async function handleContinue() {
    if (!paymentAmount || paymentAmount <= 0) return toast.error("Please enter a valid repayment amount.");
    if (paymentAmount > Number(loan.remainingBalance || 0)) return toast.error(`Amount exceeds remaining balance: ${formatNaira(loan.remainingBalance)}`);
    setIsSubmitting(true);
    try {
      const result = await initiateLoanRepayment({ loanId: loan._id, paymentAmount });
      if (!result?.success) throw new Error(result?.message || "Failed to initialize repayment.");
      const payload = result.data || {};
      console.log("Payload", payload)
      const publicKey = payload.publicKey || payload.public_key;
      const reference = payload.reference || payload.tx_ref || payload.txRef;
      if (!window.PaystackPop || !publicKey || !reference) throw new Error("Unable to start Paystack checkout.");

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: payload.customer?.email,
        amount: payload.amountKobo || Math.round(totalPayable * 100),
        currency: payload.currency || "NGN",
        ref: reference,
        metadata: payload.metadata,
        callback: (response) => {
  console.log("🔥 PAYSTACK CALLBACK FIRED");
  console.log("PAYSTACK CALLBACK RESPONSE:", response);

  const responseReference = response?.reference || reference;

  (async () => {
    try {
      console.log("🔥 ABOUT TO VERIFY WITH BACKEND");

      const verification = await verifyLoanRepayment({
        loanId: loan._id,
        reference: responseReference,
        transactionId: response?.transaction || response?.trx || response?.transactionId, 
        tx_ref:response?.trxref, // backward-compat field name during rollout
      });

      if (!verification?.success) {
        return toast.error(
          verification?.message || "Verification failed."
        );
      }

      toast.success("Loan repayment successful.");

      navigate(ROUTES.LOAN_REPAY_SUCCESS, {
        state: {
          amount: paymentAmount,
          method: selectedMethod,
          reference: responseReference,
          remainingBalance: verification.loan?.remainingBalance,
          date: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("🔥 VERIFY CALLBACK ERROR:", error);
      console.error("🔥 STATUS:", error?.status);
      console.error("🔥 DATA:", error?.data);

      toast.error(
        error?.data?.message ||
        error?.message ||
        "Verification failed."
      );
    }
  })();
},
        onClose: () => {},
      });

      handler.openIframe();
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Loan repayment failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

    <h1 className="text-lg font-bold tracking-tight">Loans Repayment</h1>

    <div className="w-10" />
  </div>
</header>

      <main className="mt-4 space-y-5 px-4"><section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm font-extrabold">Active Loan</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold capitalize text-emerald-700">{loan.status.replace(/_/g, " ")}</span></div>
          <div className="mb-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/70 text-emerald-600"><HandCoins className="h-6 w-6" /></div><div><h2 className="text-base font-extrabold capitalize">{loan.loanType || "Cooperative"} Loan</h2><p className="text-xs font-medium text-gray-400">Loan ID: {loan.loanNumber || loan._id}</p></div></div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-left"><LoanValue label="Loan Amount" value={formatNaira(loan.principalAmount)} /><LoanValue label="Outstanding Balance" value={formatNaira(loan.remainingBalance)} /><LoanValue label="Next Payment" value={formatNaira(nextPayment?.amountDue || 0)} valueClass="text-emerald-600" /></div>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="flex justify-between text-xs font-bold text-gray-700"><span>Paid: <span className="text-emerald-600">{formatNaira(paidAmount)}</span> <span className="font-normal text-gray-500">({progress}%)</span></span><span className="text-gray-500">Total: {formatNaira(totalRepayable)}</span></div>
        </section>
        <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-md">
          <label className="block text-xs font-extrabold">Enter Amount</label>
          <div className="flex items-center gap-2"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-600 bg-blue-50/50 text-lg font-extrabold text-indigo-700">₦</div><input type="number" min="1" max={loan.remainingBalance} placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-12 w-full rounded-xl border border-blue-600 px-4 text-base font-extrabold outline-none focus:ring-1 focus:ring-blue-600" /></div>
          <div className="grid grid-cols-4 gap-2 pt-1">{QUICK_AMOUNTS.map((quickAmount) => <button key={quickAmount} type="button" onClick={() => setAmount(String(Math.min(quickAmount, loan.remainingBalance)))} className="rounded-lg border border-gray-200 bg-gray-50/50 py-2 text-[10px] font-bold text-gray-700 hover:border-indigo-200 hover:bg-indigo-50">{formatNaira(quickAmount)}</button>)}</div>
          <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-xs"><div className="flex justify-between"><span className="text-gray-500">Repayment amount</span><strong>{formatNaira(paymentAmount)}</strong></div><div className="flex justify-between"><span className="text-gray-500">Paystack fee</span><strong>{formatNaira(fee)}</strong></div><div className="flex justify-between border-t border-gray-200 pt-1 font-bold"><span>Total charged</span><strong className="text-emerald-600">{formatNaira(totalPayable)}</strong></div></div>
        </section>
        <section><h3 className="mb-2 text-sm font-extrabold">Upcoming Payment</h3><div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">{nextPayment ? <div className="flex items-center justify-between gap-3"><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 text-white"><span className="text-[10px]">DUE</span><span className="text-sm font-bold">{formatDate(nextPayment.dueDate, "dd MMM")}</span><span className="text-[9px]">{formatDate(nextPayment.dueDate, "yyyy")}</span></div><div className="grid flex-1 grid-cols-3 gap-1 divide-x divide-emerald-200/60 text-center"><LoanValue label="Amount" value={formatNaira(nextPayment.amountDue)} /><LoanValue label="Principal" value={formatNaira(nextPayment.amountDue)} /><LoanValue label="Interest" value={formatNaira(0)} /></div></div> : <p className="text-xs font-semibold text-emerald-700">No upcoming payment scheduled.</p>}</div></section>
        <section><h3 className="mb-2 text-sm font-extrabold">Payment Method</h3><div className="space-y-2"><PaymentMethod method="bank" selectedMethod={selectedMethod} onSelect={setSelectedMethod} icon={Building2} title="Bank Transfer" description="Transfer from your bank account" /><PaymentMethod method="card" selectedMethod={selectedMethod} onSelect={setSelectedMethod} icon={CreditCard} title="Debit Card" description="Visa, Mastercard, Verve" /><PaymentMethod method="ussd" selectedMethod={selectedMethod} onSelect={setSelectedMethod} icon={QrCode} title="USSD" description="Complete with your bank USSD code" /></div><p className="mt-2 text-[11px] text-gray-500">Paystack will process the selected payment option after you continue.</p></section>
        {membershipUnpaid && <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs text-orange-900"><p className="font-bold">Membership fee required</p><p className="mt-1">Pay {formatNaira(MEMBERSHIP_FEE_AMOUNT)} to unlock loan repayment.</p><Button fullWidth variant="secondary" className="mt-3" onClick={() => navigate(ROUTES.MEMBERSHIP_FEE)}>Pay Membership Fee</Button></section>}
        <Button fullWidth size="lg" isLoading={isSubmitting} disabled={membershipUnpaid} onClick={handleContinue}>Continue</Button>
      </main>
    </div>
  );
}

function LoanValue({ label, value, valueClass = "" }) { return <div><p className="text-[10px] font-semibold text-gray-500">{label}</p><p className={`mt-0.5 text-xs font-extrabold text-gray-900 ${valueClass}`}>{value}</p></div>; }
function PaymentMethod({ method, selectedMethod, onSelect, icon: Icon, title, description }) { const selected = method === selectedMethod; return <button type="button" onClick={() => onSelect(method)} className={`flex w-full items-center justify-between rounded-2xl border bg-white p-3.5 text-left shadow-sm ${selected ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-100"}`}><span className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}><Icon className="h-5 w-5" /></span><span><span className="block text-xs font-bold text-gray-900">{title}</span><span className="block text-[10px] font-medium text-gray-400">{description}</span></span></span><ChevronRight className="h-4 w-4 text-gray-400" /></button>; }