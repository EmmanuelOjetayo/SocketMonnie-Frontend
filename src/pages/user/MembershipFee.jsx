import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { initializeMembershipFee, verifyMembershipFee } from "@/services/savings";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { calculateFlutterwaveFee } from "@/utils/flutterwaveFee";
import { payWithFlutterwave, isPaymentWindowClosed } from "@/utils/flutterwaveCheckout";
import { settleAndNavigate } from "@/utils/paymentResultNav";

const MEMBERSHIP_FEE_AMOUNT = 1000;

export function MembershipFee() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);

  const { fee, totalPayable } = calculateFlutterwaveFee(MEMBERSHIP_FEE_AMOUNT);

  async function handlePay() {
    setIsSubmitting(true);
    let checkoutRef = null;
    let checkoutTxId = null;
    try {
      const res = await initializeMembershipFee();
      const payload = res?.data?.data || res?.data || res;
      const publicKey = payload?.publicKey || payload?.public_key;
      const reference = payload?.reference || payload?.tx_ref || payload?.txRef;
      const currency = payload?.currency || "NGN";
      const customerPayload = payload?.customer || payload;
      const amountToCharge = Number(payload?.amount || totalPayable);

      if (!publicKey || !reference) {
        toast.error("Failed to initialize membership fee payment.");
        setIsSubmitting(false);
        return;
      }

      checkoutRef = reference;

      const response = await payWithFlutterwave({
        publicKey,
        tx_ref: reference,
        amount: amountToCharge,
        currency,
        customer: customerPayload,
        meta: payload?.meta,
        metadata: payload?.metadata,
        customizations: payload?.customizations,
        // Server-owned split id — used only in this checkout request.
        subaccount_id: payload?.subaccount_id,
      });

      console.log("[MEMBERSHIP] FLW RESPONSE:", response);

      const responseReference = response?.tx_ref || response?.reference || reference;
      checkoutTxId = response?.transaction_id || response?.id || null;

      if (response?.status && response?.status !== "successful") {
        toast.error("Payment " + (response?.status) + ". Please try again.");
        setIsSubmitting(false);
        /*
         * Show the result page regardless: the backend polls for the final
         * outcome and will render the failure state.
         */
        settleAndNavigate({
          navigate,
          route: ROUTES.MEMBERSHIP_SUCCESS,
          reference: checkoutRef,
          verify: () =>
            verifyMembershipFee({
              reference: checkoutRef,
              tx_ref: checkoutRef,
              transaction_id: checkoutTxId,
            }),
          state: {
            amount: totalPayable,
            reference: checkoutRef,
          },
        });
        return;
      }

      /*
       * The checkout callback is only a navigation hint. The webhook (or the
       * background verify fired below) marks the fee paid server-side, and
       * MembershipSuccessPage polls GET /api/payments/status/:reference — the
       * backend is the source of truth. Navigate immediately.
       */
      toast.success("Payment received - confirming your membership...");
      setIsSubmitting(false);
      settleAndNavigate({
        navigate,
        route: ROUTES.MEMBERSHIP_SUCCESS,
        reference: checkoutRef,
        verify: () =>
          verifyMembershipFee({
            reference: checkoutRef,
            tx_ref: checkoutRef,
            transaction_id: checkoutTxId,
          }),
        state: {
          amount: totalPayable,
          reference: checkoutRef,
        },
      });
    } catch (error) {
      if (isPaymentWindowClosed(error)) {
        /*
         * The customer closed the checkout window — the normal path with bank
         * transfer (they pay from their banking app, then close the modal).
         * The webhook settles the payment server-side. Show the result page,
         * which polls the backend and converges on the real outcome.
         */
        toast("If you completed the payment, this page will confirm it automatically.");
        setIsSubmitting(false);
        settleAndNavigate({
          navigate,
          route: ROUTES.MEMBERSHIP_SUCCESS,
          reference: checkoutRef,
          verify: () =>
            verifyMembershipFee({
              reference: checkoutRef,
              tx_ref: checkoutRef,
              transaction_id: null,
            }),
          state: {
            amount: totalPayable,
            reference: checkoutRef,
          },
        });
      } else {
        toast.error(error?.data?.message || error?.message || "Could not start payment - please try again");
      }
      setIsSubmitting(false);
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F6F9] to-[#dee3f9]/20 pb-16 font-sans text-[#090f24]">
      {/* 1. Compact Header */}
      <header
        className="relative px-4 pt-3 pb-12 rounded-b-[24px] text-white shadow-sm"
        style={{
          background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="size-4.5 text-white" />
          </button>
          <h1 className="text-xs font-bold tracking-tight text-white">
            Cooperative Membership
          </h1>
          <div className="w-4.5" />
        </div>
      </header>

      {/* 2. Floating Info Card with Shadow */}
      <div className="px-4 mt-4 sm:px-6">
        <div className="bg-white rounded-xl p-4 shadow-md border border-[#bdc8f3]/40 space-y-3.5">
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
              <span className="font-semibold text-[#090f24]">
                {formatNaira(MEMBERSHIP_FEE_AMOUNT)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Processing Fee</span>
              <span className="font-semibold text-[#090f24]">
                {formatNaira(fee)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-gray-200 flex justify-between font-bold text-[#090f24]">
              <span>Total Payable</span>
              <span className="text-[#3557d4]">
                {formatNaira(totalPayable)}
              </span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-2 text-left flex items-start gap-1.5 border border-amber-200/60">
            <Lock className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 font-medium leading-tight">
              Payment unlocks savings deposits, loan applications, and cooperative benefits.
            </p>
          </div>
        </div>

        {/* 3. Action Section with Enhanced Button */}
        <div className="mt-6 space-y-2">
          <Button
            fullWidth
            size="md"
            isLoading={isSubmitting}
            onClick={handlePay}
            className="bg-[#131e49] hover:bg-[#090f24] text-white text-xs font-bold py-2.5 rounded-xl shadow-xl transition-all focus:ring-2 focus:ring-[#3B62EC] focus:ring-offset-2"
          >
            Pay Membership Fee
          </Button>

          <p className="text-center text-[10px] text-gray-400">
            Payments are securely processed by Flutterwave.
          </p>
        </div>
      </div>
    </div>
  );
}