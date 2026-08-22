import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { initializeMembershipFee, verifyMembershipFee } from "@/services/savings";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { calculatePaystackFee } from "@/utils/paystackFee";

const MEMBERSHIP_FEE_AMOUNT = 1000;
const { fee, totalPayable } = calculatePaystackFee(MEMBERSHIP_FEE_AMOUNT);

export function MembershipFee() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handlePay() {
    setIsSubmitting(true);
    try {
      const res = await initializeMembershipFee();
      const payload = res?.data?.data || res?.data || res;
      const publicKey = payload?.publicKey || payload?.public_key;
      const reference = payload?.reference || payload?.tx_ref || payload?.txRef;
      const currency = payload?.currency || "NGN";
      const customerPayload = payload?.customer || payload;

      const email = customerPayload?.email;

      if (!window.PaystackPop) {
        toast.error("Paystack checkout is not loaded.");
        setIsSubmitting(false);
        return;
      }

      if (!publicKey || !reference || !email) {
        toast.error("Failed to initialize membership fee payment.");
        setIsSubmitting(false);
        return;
      }

      // Launch Paystack Popup
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: payload?.amountKobo || Math.round(totalPayable * 100),
        currency,
        ref: reference,
        metadata: payload?.metadata,
        callback: (response) => {
          console.log("Paystack raw response:", response);

          // Paystack's callback only fires on success and only ever
          // provides `reference` — there is no separate numeric
          // transaction id or a "status" field to check here the way
          // Flutterwave had.
          const responseReference = response?.reference || reference;

          (async () => {
            try {
              const verifyRes = await verifyMembershipFee({
                reference: responseReference,
                tx_ref: responseReference,
              });

              console.log("Membership verification response:", verifyRes);

              if (verifyRes?.success) {
                toast.success("Membership confirmed. You can now access savings and loans.");
                navigate(ROUTES.SAVINGS_DEPOSIT || "/dashboard");
              } else {
                toast.error(verifyRes?.message || "Membership verification failed.");
              }
            } catch (verifyError) {
              toast.error(verifyError?.data?.message || verifyError?.message || "Verification failed.");
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
        onClose: () => {
          setIsSubmitting(false);
          toast.error("Payment window closed. Please complete your membership fee to continue.");
        },
      });

      handler.openIframe();
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Could not start payment — please try again");
      setIsSubmitting(false);
    }
    // Notice: Removed top-level finally block to prevent clearing state while modal is open
  }

  return (
    <div className="relative min-h-screen bg-[#dee3f9]/20 pb-16 font-sans text-[#090f24]">
      {/* 1. Compact Header */}
      <header
        className="relative px-4 pt-3 pb-12 rounded-b-[24px] text-white shadow-sm"
        style={{
          background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD || "/dashboard")}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="size-4.5 text-white" />
          </button>
          <h1 className="text-xs font-bold tracking-tight text-white">Cooperative Membership</h1>
          <div className="w-4.5" />
        </div>
      </header>

      {/* 2. Floating Info Card */}
      <div className="px-4 mt-4 sm:px-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bdc8f3]/40 space-y-3.5">
          <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="size-5" />
          </div>

          <div className="text-center space-y-0.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              Cooperative Membership Fee
            </p>
            <h2 className="text-xl font-extrabold text-[#090f24]">
              {formatNaira(MEMBERSHIP_FEE_AMOUNT)}
            </h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-gray-600">
              <span>Membership Amount</span>
              <span className="font-semibold text-[#090f24]">{formatNaira(MEMBERSHIP_FEE_AMOUNT)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Processing Fee</span>
              <span className="font-semibold text-[#090f24]">{formatNaira(fee)}</span>
            </div>
            <div className="pt-1.5 border-t border-gray-200 flex justify-between font-bold text-[#090f24]">
              <span>Total Payable</span>
              <span className="text-[#3557d4]">{formatNaira(totalPayable)}</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-2 text-left flex items-start gap-1.5 border border-amber-200/60">
            <Lock className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 font-medium leading-tight">
              Payment unlocks savings deposits, loan applications, and cooperative benefits.
            </p>
          </div>
        </div>

        {/* 3. Action Section */}
        <div className="mt-5 space-y-2">
          <Button
            fullWidth
            size="md"
            isLoading={isSubmitting}
            onClick={handlePay}
            className="bg-[#131e49] hover:bg-[#090f24] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all"
          >
            Pay Membership Fee
          </Button>

          <p className="text-center text-[10px] text-gray-400">
            Payments are securely processed by Paystack.
          </p>
        </div>
      </div>
    </div>
  );
}