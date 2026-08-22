import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Wallet,
  Percent,
  BarChart2,
  Building2,
  User,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/forms/OtpInput";
import { requestWithdrawal } from "@/services/savings";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

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

  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const total = Number(amount || 0) + Number(fee || 0);

  useEffect(() => {
    if (!amount || !bankName || !accountName || !accountNumber) {
      toast.error("Invalid withdrawal session. Please start again.");
      navigate(ROUTES.SAVINGS_WITHDRAW, { replace: true });
    }
  }, [
    amount,
    bankName,
    accountName,
    accountNumber,
    navigate,
  ]);

  async function handleConfirm() {
    if (!/^\d{4}$/.test(pin)) {
      return toast.error("Please enter your 4-digit transaction PIN.");
    }

    setIsLoading(true);

    try {
      const response = await requestWithdrawal({
        amount: Number(amount),
        accountNumber,
        accountName,
        bankName,
        pin,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Withdrawal request failed."
        );
      }

      toast.success("Withdrawal request submitted successfully.");

      navigate(ROUTES.SAVINGS_WITHDRAW_SUCCESS, {
        state: {
          amount,
          fee,
          totalDeducted: total,
          isPending: true,
          status: "pending_approval",
          destinationBank: {
            bankName,
            accountName,
            accountNumber,
          },
          reference:
            response?.data?.reference ||
            response?.data?.withdrawal?.reference ||
            `WTH_REQ_${Date.now()}`,
          date: new Date().toISOString(),
        },
      });
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to process withdrawal request."
      );
    } finally {
      setIsLoading(false);
    }
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
        {/* Withdrawal Summary */}
        <section className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
          <h2 className="text-sm font-extrabold">
            Withdrawal Summary
          </h2>

          <div className="space-y-3">
            <SummaryRow
              icon={Wallet}
              label="Amount"
              value={formatNaira(amount, { decimals: 2 })}
            />

            <SummaryRow
              icon={Percent}
              label="Withdrawal fee"
              value={formatNaira(fee, { decimals: 2 })}
            />

            <SummaryRow
              icon={BarChart2}
              label="Total deduction"
              value={formatNaira(total, { decimals: 2 })}
              emphasize
            />

            <SummaryRow
              icon={Building2}
              label="Destination Bank"
              value={bankName}
            />

            <SummaryRow
              icon={User}
              label="Account Name"
              value={accountName}
            />

            <SummaryRow
              icon={CreditCard}
              label="Account Number"
              value={accountNumber}
            />
          </div>
        </section>

        {/* PIN */}
        <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="block text-sm font-extrabold">
            Enter your 4-digit transaction PIN
          </label>

          <OtpInput
            length={4}
            value={pin}
            onChange={setPin}
          />

          <p className="text-[11px] font-medium text-amber-700">
            This withdrawal request will be sent to admin for
            approval before the payout is processed.
          </p>
        </section>

        {/* Confirm */}
        <Button
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isLoading || !/^\d{4}$/.test(pin)}
          onClick={handleConfirm}
        >
          Confirm Withdrawal
        </Button>
      </main>
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
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-xs font-bold text-gray-800">
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