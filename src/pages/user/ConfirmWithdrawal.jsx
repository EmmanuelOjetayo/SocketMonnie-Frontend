import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Wallet,
  Percent,
  Building2,
  User,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TransactionPinSheet } from "@/components/forms/TransactionPinSheet";
import { requestWithdrawal } from "@/services/savings";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

/** Show only the last four digits — the confirmation page never needs the full account number. */
function maskAccount(accountNumber) {
  const digits = String(accountNumber || "");
  if (digits.length < 4) return digits || "—";
  return `•••• ${digits.slice(-4)}`;
}

export function ConfirmWithdrawal() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    amount,
    bankName,
    accountName,
    accountNumber,
    fee = 100,
  } = state || {};

  const [pinSheetOpen, setPinSheetOpen] = useState(false);

  const numericAmount = Number(amount || 0);
  const numericFee = Number(fee || 0);
  // Matches SavingsService.requestWithdrawal: the fee is charged on top of
  // the withdrawal amount, so `amount + fee` leaves the savings balance.
  const totalDeduction = numericAmount + numericFee;

  useEffect(() => {
    if (!amount || !bankName || !accountName || !accountNumber) {
      toast.error("Invalid withdrawal session. Please start again.");
      navigate(ROUTES.SAVINGS_WITHDRAW, { replace: true });
    }
  }, [amount, bankName, accountName, accountNumber, navigate]);

  /**
   * Called by the PIN sheet once the member has entered their PIN. The sheet
   * keeps the sheet open on failure (showing the backend error) and closes it
   * on success, so authorization can never run twice from one confirmation.
   */
  async function handleAuthorize(pin) {
    const response = await requestWithdrawal({
      amount: numericAmount,
      accountNumber,
      accountName,
      bankName,
      pin,
    });

    if (!response?.success) {
      throw new Error(response?.message || "Withdrawal request failed.");
    }

    toast.success("Withdrawal request submitted successfully.");

    setPinSheetOpen(false);

    navigate(ROUTES.SAVINGS_WITHDRAW_SUCCESS, {
      state: {
        amount: numericAmount,
        fee: numericFee,
        totalDeducted: totalDeduction,
        isPending: true,
        status: "pending_approval",
        destinationBank: { bankName, accountName, accountNumber },
        reference:
          response?.data?.reference ||
          response?.data?.withdrawal?.reference ||
          `WTH_REQ_${Date.now()}`,
        date: new Date().toISOString(),
      },
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-24 font-sans text-gray-900">
      {/* Header */}
      <header
        className="relative px-5 py-4 text-white shadow-lg"
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          background:
            "linear-gradient(to bottom, #2563eb, #4f46e5 60%, #4338ca)",
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

          <h1 className="text-center text-lg font-bold leading-tight tracking-tight">
            Confirm
            <br />
            Withdrawal
          </h1>

          <div className="w-10" />
        </div>
      </header>

      <main className="mt-4 space-y-5 px-4">
        {/* Amount + charges */}
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-600">
              <Wallet className="size-3.5" />
              Amount to withdraw
            </span>

            <p className="mt-2 text-3xl font-black tracking-tight text-text-primary">
              {formatNaira(numericAmount, { decimals: 2 })}
            </p>

            <p className="mt-1 text-[11px] text-text-secondary">
              Paid into your verified bank account
            </p>
          </div>

          <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-4">
            <SummaryRow
              icon={Percent}
              label="Withdrawal fee"
              value={formatNaira(numericFee, { decimals: 2 })}
            />

            <SummaryRow
              icon={Wallet}
              label="Total deduction from savings"
              value={formatNaira(totalDeduction, { decimals: 2 })}
              emphasize
            />
          </div>
        </section>

        {/* Destination */}
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
          <h2 className="text-sm font-extrabold text-text-primary">
            Destination account
          </h2>

          <div className="mt-3 space-y-2.5">
            <SummaryRow
              icon={Building2}
              label="Bank"
              value={bankName}
            />

            <SummaryRow
              icon={User}
              label="Account name"
              value={accountName}
            />

            <SummaryRow
              icon={CreditCard}
              label="Account number"
              value={maskAccount(accountNumber)}
            />
          </div>
        </section>

        {/* Approval note */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            This withdrawal request is sent to an admin for approval before the
            payout is processed. You&rsquo;ll be notified once it&rsquo;s approved.
          </p>
        </div>

        {/* Confirm — opens the PIN bottom sheet */}
        <Button
          fullWidth
          size="lg"
          icon={ShieldCheck}
          onClick={() => setPinSheetOpen(true)}
        >
          Confirm withdrawal
        </Button>
      </main>

      <TransactionPinSheet
        isOpen={pinSheetOpen}
        onClose={() => setPinSheetOpen(false)}
        onComplete={handleAuthorize}
        context={`${formatNaira(numericAmount, {
          decimals: 2,
        })} to ${bankName} ${maskAccount(accountNumber)}`}
      />
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  emphasize = false,
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            emphasize
              ? "bg-emerald-50 text-emerald-600"
              : "bg-indigo-100 text-indigo-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span className="truncate text-xs font-bold text-gray-800">
          {label}
        </span>
      </div>

      <span
        className={`max-w-[55%] break-words text-right ${
          emphasize
            ? "text-base font-black text-emerald-600"
            : "text-xs font-extrabold text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
