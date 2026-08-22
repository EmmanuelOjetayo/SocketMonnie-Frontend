import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { initiateDeposit, verifyDeposit } from "@/services/payments";
import { useAuth } from "@/context/AuthContext";
import { MIN_MONTHLY_SAVINGS } from "@/constants/config";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { calculatePaystackFee } from "@/utils/paystackFee";

const MEMBERSHIP_FEE_AMOUNT = 1000;
const QUICK_AMOUNTS = [5000, 10000, 15000, 20000];

export function SavingsDeposit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const membershipUnpaid = !user?.membershipFeePaid;

  const numAmount = Number(amount) || 0;
  const { fee } = calculatePaystackFee(numAmount);

async function handleDeposit() {
  if (!amount || Number.isNaN(numAmount) || numAmount < MIN_MONTHLY_SAVINGS) {
    toast.error(`Minimum deposit is ${formatNaira(MIN_MONTHLY_SAVINGS)}`);
    return;
  }

  setIsSubmitting(true);

  const { totalPayable } = calculatePaystackFee(numAmount);

  try {
    const response = await initiateDeposit(numAmount, "bank_transfer");

    console.log("Deposit Response:", response);

    if (!response.success) {
      throw new Error(response.message || "Unable to initialize payment.");
    }

    const payment = response.data;

    if (!payment?.reference || !payment?.publicKey) {
     console.log(payment)
      console.error("Invalid payment payload:", payment);
      throw new Error("Unable to initialize deposit payment.");
    }

    if (!window.PaystackPop) {
      throw new Error("Paystack Checkout SDK is not loaded.");
    }
console.log(payment)
    const handler = window.PaystackPop.setup({
      
      key: payment.publicKey,
      email: payment.customer?.email,
      amount: payment.amountKobo || Math.round(totalPayable * 100),
      currency: payment.currency,
      ref: payment.reference,
      metadata: payment.metadata,
      callback: (paystackResponse) => {
        console.log("Paystack Callback:", paystackResponse);

        // Paystack's callback only fires on success and only ever provides
        // `reference` -- there is no separate numeric transaction id or a
        // "status" field to branch on the way Flutterwave had.
        const reference = paystackResponse?.reference || payment.reference;

        const params = [
          `tx_ref=${encodeURIComponent(reference || "")}`,
          `reference=${encodeURIComponent(reference || "")}`,
          `amount=${encodeURIComponent(amount || "")}`,
          "method=bank_transfer",
        ];

        (async () => {
          try {
            const verifyResponse = await verifyDeposit({
              reference,
              tx_ref: reference,
            });

            if (verifyResponse.success) {
              toast.success("Deposit successful!");

              navigate(
                `${ROUTES.PAYMENTS_SAVINGS_SUCCESS}?${params.join("&")}`
              );
            } else {
              toast.error(
                verifyResponse.message || "Payment verification failed."
              );

              navigate(
                `${ROUTES.PAYMENTS_SAVINGS_FAILED}?${params.join("&")}`
              );
            }
          } catch (error) {
            console.error("Verification Error:", error);

            toast.error(
              error?.data?.message ||
              error?.message ||
              "Unable to verify payment."
            );

            navigate(
              `${ROUTES.PAYMENTS_SAVINGS_FAILED}?${params.join("&")}`
            );
          } finally {
            setIsSubmitting(false);
          }
        })();
      },
      onClose: () => {
        setIsSubmitting(false);
      },
    });

    handler.openIframe();
  } catch (error) {
    console.error("Deposit Error:", error);

    toast.error(
      error?.data?.message ||
      error?.message ||
      "Deposit failed"
    );

    setIsSubmitting(false);
  }
}

  return (
    <div className="relative min-h-screen bg-[#dee3f9]/20 pb-20 font-sans text-[#090f24] flex flex-col justify-between">
      <div>
        {/* 1. Compact Top Header */}
        <header
          className="relative px-4 pt-3 pb-12 rounded-b-[24px] text-white shadow-sm"
           style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD || "/dashboard")}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="size-6 text-white" />
            </button>
            
    <h1 className="text-center text-lg font-bold leading-tight">
     Save with 
      <br />
      Bank transfer
    </h1>
<div className="w-4.5" />
          </div>
        </header>

        {/* 2. Amount Input Floating Card (Moved Downwards) */}
        <div className="px-4 mt-4 sm:px-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bdc8f3]/40 space-y-3.5">
            <label className="text-xs font-bold  block "  style={{
        color: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}>
              Enter Amount
            </label>

            <div className="relative flex items-center rounded-xl border border-[#3557d4] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-[#3557d4]/20 transition-all">
              <span className="text-lg font-bold text-[#090f24] mr-1">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-lg font-extrabold text-[#090f24] outline-none"
              />
            </div>

            <p className="text-[11px] text-gray-500 font-medium">
              A processing fee of <span className="font-bold text-[#090f24]">{formatNaira(fee)}</span> will be charged
            </p>

            {/* Quick Amounts Pills */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-colors ${
                    Number(amount) === amt
                      ? "bg-[#071b6b] text-white border-[#131e49]" 
                      : "bg-gray-50 text-[#090f24] border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {formatNaira(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Primary Action Button */}
          <div className="mt-5">
            <Button
              fullWidth
              size="md"
              isLoading={isSubmitting}
              onClick={handleDeposit}
              className="bg-[#131e49] hover:bg-[#090f24] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all"
             style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}>
              Proceed to Payment
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer Security Tag */}
      <div className="pb-6 pt-4 text-center">
        <p className="text-[10px] text-gray-400">
          Payments are securely processed by Paystack.
        </p>
      </div>

      {/* 5. Membership Fee Modal Overlay */}
      {membershipUnpaid && (
        <div className="fixed inset-0 z-50 bg-[#090f24]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-[#bdc8f3]/40 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD || "/dashboard")}
              className="absolute top-4 left-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="size-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner mt-2">
              <ShieldCheck className="size-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#090f24]">Membership Fee Required</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pay <span className="font-bold text-[#090f24]">{formatNaira(MEMBERSHIP_FEE_AMOUNT)}</span> to unlock cooperative features, including savings deposits and loan access.
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-left flex items-start gap-2 border border-amber-200/60">
              <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 font-medium">
                Deposit transactions remain locked until membership activation is confirmed.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate(ROUTES.MEMBERSHIP_FEE)}
                className="bg-[#131e49] hover:bg-[#090f24] text-white font-bold rounded-2xl py-3 shadow-md"
              >
                Go to Membership Fee page
              </Button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD || "/dashboard")}
                className="text-xs font-semibold text-gray-500 hover:text-[#090f24] transition-colors py-1 block w-full"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}