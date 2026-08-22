import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Building2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { getSavingsSummary } from "@/services/savings";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

const WITHDRAWAL_FEE = 100;
const QUICK_AMOUNTS = [1000, 5000, 10000, 20000];

export function Withdraw() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState("");
  const { data, isLoading } = useAsync(getSavingsSummary, []);
  const balance = Number(data?.summary?.totalSaved ?? data?.data?.totalSaved ?? 0);
  const bankDetails = user?.bankDetails || {};
  const hasBankDetails = Boolean(bankDetails.bankName && bankDetails.accountName && /^\d{10}$/.test(bankDetails.accountNumber || ""));

  function handleSubmit() {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return toast.error("Please enter a valid amount.");
    if (numericAmount + WITHDRAWAL_FEE > balance) return toast.error("Insufficient savings balance to cover amount and fee.");
    if (!hasBankDetails) return toast.error("Please complete your bank details in Profile before withdrawing.");
    navigate(ROUTES.SAVINGS_WITHDRAW_CONFIRM, { state: { amount: numericAmount, fee: WITHDRAWAL_FEE, bankName: bankDetails.bankName, accountName: bankDetails.accountName, accountNumber: bankDetails.accountNumber } });
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

    <h1 className="text-center text-lg font-bold leading-tight">
      Withdraw from
      <br />
      Savings
    </h1>

    <div className="w-10" />
  </div>
</header>

      <main className="mt-4 space-y-5 px-4">
        <section className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold">Current Balance</span><button type="button" onClick={() => setShowBalance((value) => !value)} className="text-gray-600">{showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></div>{isLoading ? <LoadingState rows={1} /> : <p className="text-2xl font-black tracking-tight">{showBalance ? formatNaira(balance, { decimals: 2 }) : "••••••••"}</p>}<p className="text-xs font-semibold text-blue-600">Regular Savings</p></section>
        <section className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><label className="block text-xs font-bold">Enter Amount</label><div className="relative flex items-center"><span className="absolute left-4 text-base font-extrabold">₦</span><input type="number" min="1" max={Math.max(0, balance - WITHDRAWAL_FEE)} value={amount} onChange={(event) => setAmount(event.target.value)} className="h-11 w-full rounded-xl border border-blue-600 pl-8 pr-4 text-base font-extrabold outline-none focus:ring-1 focus:ring-blue-600" placeholder="0.00" /></div><p className="pt-0.5 text-[11px] font-medium text-gray-400">A processing fee of <span className="font-semibold text-gray-500">{formatNaira(WITHDRAWAL_FEE, { decimals: 2 })}</span> will be charged</p><div className="grid grid-cols-4 gap-2 pt-1">{QUICK_AMOUNTS.map((quickAmount) => <button key={quickAmount} type="button" onClick={() => setAmount(String(Math.min(quickAmount, Math.max(0, balance - WITHDRAWAL_FEE))))} className="rounded-lg border border-gray-100 bg-gray-50/50 py-2 text-[10px] font-bold text-gray-700 hover:border-blue-200 hover:bg-blue-50">{formatNaira(quickAmount, { decimals: 2 })}</button>)}</div></section>
        <section><h2 className="mb-2 text-xs font-extrabold">Select Withdrawal Method</h2><div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white"><Building2 className="h-5 w-5" /></div><div><p className="text-xs font-extrabold">Bank Transfer</p><p className="mt-0.5 text-[10px] text-gray-500">Transfer to linked bank account</p></div></div><ChevronRight className="h-5 w-5" /></div></section>
        <section><h2 className="mb-2 text-xs font-extrabold">Select Bank Account</h2><div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/50 bg-emerald-100/70 text-emerald-700"><Building2 className="h-5 w-5" /></div><div><p className="text-xs font-extrabold">{bankDetails.bankName || "Bank account not set"}</p><p className="mt-0.5 text-[10px] text-gray-600">{bankDetails.accountNumber || "Add account number"}{bankDetails.accountName ? ` • ${bankDetails.accountName}` : ""}</p></div></div><ChevronRight className="h-5 w-5" /></div><p className="mt-2 text-[10px] text-gray-500">This account is locked to your profile and will be sent to admin for confirmation.</p></section>
        <Button fullWidth size="lg" onClick={handleSubmit}>Request Withdrawal</Button>
      </main>
    </div>
  );
}
