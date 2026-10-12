
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock3,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/Button";

import {
  initializeMinutesContribution,
  verifyMinutesContribution,
} from "@/services/payments";

import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { payWithFlutterwave, isPaymentWindowClosed } from "@/utils/flutterwaveCheckout";

const MONTHLY_MINUTES_AMOUNT = 500;

export function Minutes() {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [paymentSummary, setPaymentSummary] =
    useState({
      contributionAmount: MONTHLY_MINUTES_AMOUNT,
      fee: 0,
      totalPayable: MONTHLY_MINUTES_AMOUNT,
      outstandingMonths: [],
    });

  async function handlePay() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      /*
       * IMPORTANT:
       *
       * We do NOT send an amount here.
       *
       * The backend determines:
       *
       * 1. The member's starting month
       * 2. Every missing month
       * 3. Overdue contributions
       * 4. Current contribution
       * 5. Total outstanding amount
       * 6. Flutterwave processing fee
       * 7. Final amount to charge
       */
      const res =
        await initializeMinutesContribution();

      console.log(
        "Minutes initialization response:",
        res
      );

      const payload =
        res?.data?.data ||
        res?.data ||
        res;

      if (!payload?.reference) {
        console.error(
          "Invalid minutes payment payload:",
          payload
        );

        throw new Error(
          "Failed to initialize SocketMinutes payment."
        );
      }

      /*
       * Backend-calculated values
       */
      const contributionAmount =
        Number(
          payload?.contributionAmount || 0
        );

      const fee =
        Number(payload?.fee || 0);

      const totalPayable =
        Number(payload?.totalPayable || 0);

      const outstandingMonths =
        payload?.outstandingMonths || [];

      /*
       * Update the UI with the actual amount
       * calculated by the backend.
       */
      setPaymentSummary({
        contributionAmount,
        fee,
        totalPayable,
        outstandingMonths,
      });

      const publicKey =
        payload?.publicKey ||
        payload?.public_key;

      const reference =
        payload?.reference ||
        payload?.tx_ref ||
        payload?.txRef;

      const currency =
        payload?.currency || "NGN";

      const customer =
        payload?.customer || {};

      const email =
        customer?.email;

      if (!publicKey || !reference || !email) {
        console.error(
          "Invalid Flutterwave payload:",
          payload
        );

        throw new Error(
          "Invalid payment information received from server."
        );
      }

      if (!totalPayable || totalPayable <= 0) {
        throw new Error(
          "Invalid payment amount received from server."
        );
      }

      /*
       * Open Flutterwave Window Checkout (Inline v3).
       *
       * The charge amount MUST come from the backend —
       * never calculate or trust the amount from
       * the frontend for the actual transaction.
       */
      let response;
      try {
        response = await payWithFlutterwave({
          publicKey,
          tx_ref: reference,
          amount: totalPayable,
          currency,
          customer,
          meta: payload?.meta,
          metadata: payload?.metadata,
          customizations: payload?.customizations,
          // Server-owned split id — used only in this checkout request.
          subaccount_id: payload?.subaccount_id,
        });
      } catch (checkoutError) {
        if (isPaymentWindowClosed(checkoutError)) {
          setIsSubmitting(false);
          toast.error(
            "Payment window closed. Your outstanding SocketMinutes contributions remain unpaid."
          );
          return;
        }
        throw checkoutError;
      }

      if (response?.status && response.status !== "successful") {
        setIsSubmitting(false);
        toast.error(`Payment ${response.status}. Please try again.`);
        return;
      }

      const paymentReference =
        response?.tx_ref || response?.reference || reference;
      const transactionId =
        response?.transaction_id || response?.id || null;

      // Backend performs authoritative verification — never trust frontend.
      try {
        const verifyResponse = await verifyMinutesContribution({
          reference: paymentReference,
          tx_ref: paymentReference,
          transaction_id: transactionId,
        });
        if (
          verifyResponse?.reference &&
          verifyResponse?.transactionId &&
          Number(verifyResponse?.monthsSettled) > 0
        ) {
          toast.success(
            "Your SocketMinutes contributions have been cleared successfully!"
          );
          navigate(ROUTES.SAVINGS_DEPOSIT);
        } else {
          console.error(
            "Unexpected verification response:",
            verifyResponse
          );

          toast.error("Minutes payment verification failed.");
        }
      } catch (error) {
        console.error("Minutes verification error:", error);

        toast.error(
          error?.data?.message ||
            error?.message ||
            "Unable to verify SocketMinutes payment."
        );
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(
        "Minutes initialization error:",
        error
      );

      toast.error(
        error?.data?.message ||
          error?.message ||
          "Could not start SocketMinutes payment."
      );

      setIsSubmitting(false);
    }
  }

  const {
    contributionAmount,
    fee,
    totalPayable,
    outstandingMonths,
  } = paymentSummary;

  /*
   * Number of months currently outstanding.
   *
   * Initially this will be 0/unknown until the backend
   * initializes the payment. The normal current
   * contribution is still displayed before that.
   */
  const monthsCount =
    outstandingMonths.length;

  return (
    <div className="relative min-h-screen bg-[#dee3f9]/20 pb-16 font-sans text-[#090f24]">

      {/* Header */}
      <header
        className="relative px-4 pt-3 pb-12 rounded-b-[24px] text-white shadow-sm"
        style={{
          background:
            "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
        }}
      >
        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              navigate(
                ROUTES.DASHBOARD ||
                  "/dashboard"
              )
            }
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="size-4.5 text-white" />
          </button>

          <h1 className="text-xs font-bold tracking-tight text-white">
            SocketMinutes
          </h1>

          <div className="w-4.5" />
        </div>
      </header>

      {/* Main */}
      <div className="px-4 mt-4 sm:px-6">

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bdc8f3]/40 space-y-3.5">

          {/* Icon */}
          <div className="size-10 rounded-xl bg-blue-100 text-[#3557d4] flex items-center justify-center mx-auto shadow-inner">
            <Clock3 className="size-5" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-0.5">

            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              SocketMinutes
            </p>

            <h2 className="text-xl font-extrabold text-[#090f24]">
              {formatNaira(
                MONTHLY_MINUTES_AMOUNT
              )}
            </h2>

            <p className="text-[10px] text-gray-500">
              Required every month
            </p>

          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 space-y-1.5 text-[11px]">

            <div className="flex justify-between text-gray-600">
              <span>
                Monthly Contribution
              </span>

              <span className="font-semibold text-[#090f24]">
                {formatNaira(
                  MONTHLY_MINUTES_AMOUNT
                )}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>
                Outstanding Arrears
              </span>

              <span className="font-semibold text-[#090f24]">
                {formatNaira(
                  Math.max(
                    0,
                    contributionAmount -
                      MONTHLY_MINUTES_AMOUNT
                  )
                )}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>
                Processing Fee
              </span>

              <span className="font-semibold text-[#090f24]">
                {formatNaira(fee)}
              </span>
            </div>

            <div className="pt-1.5 border-t border-gray-200 flex justify-between font-bold text-[#090f24]">

              <span>
                Total Payable
              </span>

              <span className="text-[#3557d4]">
                {formatNaira(
                  totalPayable
                )}
              </span>

            </div>

          </div>

          {/* Outstanding information */}
          {monthsCount > 1 && (
            <div className="bg-amber-50 rounded-lg p-2.5 text-left border border-amber-200/60">

              <p className="text-[10px] font-bold text-amber-800">
                Outstanding Contributions
              </p>

              <p className="text-[10px] text-amber-700 mt-0.5">
                You have {monthsCount} monthly
                SocketMinutes contributions
                waiting to be settled.
              </p>

            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 rounded-lg p-2 text-left flex items-start gap-1.5 border border-blue-200/60">

            <Clock3 className="size-3.5 text-[#3557d4] shrink-0 mt-0.5" />

            <p className="text-[10px] text-blue-800 font-medium leading-tight">

              Your monthly SocketMinutes
              contribution is ₦500. Any unpaid
              previous months will automatically
              be added to your payment.

            </p>

          </div>

        </div>

        {/* Button */}
        <div className="mt-5 space-y-2">

          <Button
            fullWidth
            size="md"
            isLoading={isSubmitting}
            onClick={handlePay}
            className="bg-[#131e49] hover:bg-[#090f24] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all"
          >
            {isSubmitting
              ? "Preparing Payment..."
              : "Pay SocketMinutes"}
          </Button>

          <p className="text-center text-[10px] text-gray-400">
            Payments are securely processed
            by Flutterwave.
          </p>

        </div>

      </div>
    </div>
  );
}