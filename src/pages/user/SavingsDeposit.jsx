
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  initiateDeposit,
  verifyDeposit,
  getMinutesDue,
} from "@/services/payments";

import { useAuth } from "@/context/AuthContext";
import { MIN_MONTHLY_SAVINGS } from "@/constants/config";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { calculateFlutterwaveFee } from "@/utils/flutterwaveFee";
import { payWithFlutterwave, isPaymentWindowClosed } from "@/utils/flutterwaveCheckout";

const MEMBERSHIP_FEE_AMOUNT = 1000;
const QUICK_AMOUNTS = [5000, 10000, 15000, 20000];

export function SavingsDeposit() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [amount, setAmount] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backend-calculated Minutes obligation
  const [minutesDue, setMinutesDue] = useState(null);
  const [loadingMinutesDue, setLoadingMinutesDue] = useState(true);

  const membershipUnpaid = !user?.membershipFeePaid;

  const numAmount = Number(amount) || 0;

  const { fee } = calculateFlutterwaveFee(numAmount);

  /**
   * Ask backend whether this user has any outstanding
   * SocketMinutes contributions.
   *
   * IMPORTANT:
   * We do NOT calculate overdue months on the frontend.
   * The backend is the source of truth.
   */
  useEffect(() => {
    let mounted = true;

    async function loadMinutesDue() {
      // No need to check Minutes if membership is unpaid.
      if (membershipUnpaid) {
        setLoadingMinutesDue(false);
        return;
      }

      try {
        setLoadingMinutesDue(true);

        const response = await getMinutesDue();

        console.log(
          "Minutes due response:",
          response
        );

        const data =
          response?.data?.data ||
          response?.data ||
          response;

        if (mounted) {
          setMinutesDue(data);
        }
      } catch (error) {
        console.error(
          "Failed to load Minutes due:",
          error
        );

        if (mounted) {
          setMinutesDue(null);

          toast.error(
            error?.data?.message ||
              error?.message ||
              "Unable to check your monthly contribution status."
          );
        }
      } finally {
        if (mounted) {
          setLoadingMinutesDue(false);
        }
      }
    }

    loadMinutesDue();

    return () => {
      mounted = false;
    };
  }, [membershipUnpaid]);

  /**
   * Backend should return:
   *
   * {
   *   overdueMonths: 2,
   *   overdueAmount: 1000,
   *   currentMonthDue: 500,
   *   totalMinutesDue: 1500
   * }
   *
   * We intentionally support a few names so the frontend
   * remains tolerant of the backend response.
   */
  const overdueMonths =
    Number(
      minutesDue?.overdueMonths ??
      minutesDue?.monthsOverdue ??
      0
    );

  const overdueAmount =
    Number(
      minutesDue?.overdueAmount ??
      minutesDue?.overdueTotal ??
      0
    );

  const currentMonthDue =
    Number(
      minutesDue?.currentMonthDue ??
      0
    );

  const totalMinutesDue =
    Number(
      minutesDue?.totalMinutesDue ??
      minutesDue?.totalDue ??
      minutesDue?.amountDue ??
      overdueAmount + currentMonthDue
    );

  const minutesUnpaid =
    !loadingMinutesDue &&
    totalMinutesDue > 0;

  console.log("Minutes status:", {
    overdueMonths,
    overdueAmount,
    currentMonthDue,
    totalMinutesDue,
    minutesUnpaid,
  });

  async function handleDeposit() {
    /**
     * Final frontend guard.
     *
     * The backend must ALSO enforce this.
     * Never rely on frontend locking for financial rules.
     */
    if (membershipUnpaid) {
      toast.error(
        "Please pay your membership fee first."
      );

      navigate(
        ROUTES.MEMBERSHIP_FEE
      );

      return;
    }

    if (loadingMinutesDue) {
      toast.error(
        "Checking your monthly contribution status..."
      );

      return;
    }

    if (minutesUnpaid) {
      toast.error(
        `Please settle your outstanding SocketMinutes contribution of ${formatNaira(
          totalMinutesDue
        )} first.`
      );

      navigate(
        ROUTES.MINUTES
      );

      return;
    }

    if (
      !amount ||
      Number.isNaN(numAmount) ||
      numAmount < MIN_MONTHLY_SAVINGS
    ) {
      toast.error(
        `Minimum deposit is ${formatNaira(
          MIN_MONTHLY_SAVINGS
        )}`
      );

      return;
    }

    setIsSubmitting(true);

    const {
      totalPayable,
    } = calculateFlutterwaveFee(numAmount);

    try {
      const response =
        await initiateDeposit(
          numAmount,
          "bank_transfer"
        );

      console.log(
        "Deposit Response:",
        response
      );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Unable to initialize payment."
        );
      }

      const payment =
        response.data;

      if (
        !payment?.reference ||
        !payment?.publicKey
      ) {
        console.error(
          "Invalid payment payload:",
          payment
        );

        throw new Error(
          "Unable to initialize deposit payment."
        );
      }

      // Open Flutterwave Window Checkout (Inline v3).
      const flwResponse = await payWithFlutterwave({
        publicKey: payment.publicKey || payment.public_key,
        tx_ref: payment.reference || payment.tx_ref,
        amount: Number(payment.amount || totalPayable),
        currency: payment.currency || "NGN",
        customer: payment.customer || {},
        meta: payment.meta,
        metadata: payment.metadata,
        customizations: payment.customizations,
        // Server-owned split id — used only in this checkout request.
        subaccount_id: payment.subaccount_id,
      });

      if (flwResponse?.status && flwResponse.status !== "successful") {
        toast.error(`Payment ${flwResponse.status}. Please try again.`);
        setIsSubmitting(false);
        return;
      }

      const reference =
        flwResponse?.tx_ref ||
        flwResponse?.reference ||
        payment.reference;
      const transactionId =
        flwResponse?.transaction_id || flwResponse?.id || null;

      const params = [
        `tx_ref=${encodeURIComponent(reference || "")}`,
        `reference=${encodeURIComponent(reference || "")}`,
        `transaction_id=${encodeURIComponent(transactionId || "")}`,
        `amount=${encodeURIComponent(amount || "")}`,
        "method=bank_transfer",
      ];

      // Backend performs authoritative verification — never trust frontend.
      try {
        const verifyResponse = await verifyDeposit({
          reference,
          tx_ref: reference,
          transaction_id: transactionId,
        });

        if (verifyResponse.success) {
          toast.success("Deposit successful!");
          navigate(`${ROUTES.PAYMENTS_SAVINGS_SUCCESS}?${params.join("&")}`);
        } else {
          toast.error(
            verifyResponse.message || "Payment verification failed."
          );
          navigate(`${ROUTES.PAYMENTS_SAVINGS_FAILED}?${params.join("&")}`);
        }
      } catch (error) {
        console.error("Verification Error:", error);
        toast.error(
          error?.data?.message || error?.message || "Unable to verify payment."
        );
        navigate(`${ROUTES.PAYMENTS_SAVINGS_FAILED}?${params.join("&")}`);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      if (isPaymentWindowClosed(error)) {
        toast.error("Payment window closed.");
      } else {
        console.error("Deposit Error:", error);
        toast.error(
          error?.data?.message || error?.message || "Deposit failed"
        );
      }

      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#dee3f9]/20 pb-20 font-sans text-[#090f24] flex flex-col justify-between">

      <div>
        {/* Header */}
        <header
          className="relative px-4 pt-3 pb-12 rounded-b-[24px] text-white shadow-sm"
          style={{
            background:
              "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
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

        {/* Amount Card */}
        <div className="px-4 mt-4 sm:px-6">

          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#bdc8f3]/40 space-y-3.5">

            <label className="text-xs font-bold block">
              Enter Amount
            </label>

            <div className="relative flex items-center rounded-xl border border-[#3557d4] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-[#3557d4]/20 transition-all">

              <span className="text-lg font-bold text-[#090f24] mr-1">
                ₦
              </span>

              <input
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="0.00"
                className="w-full bg-transparent text-lg font-extrabold text-[#090f24] outline-none"
              />
            </div>

            <p className="text-[11px] text-gray-500 font-medium">
              A processing fee of{" "}
              <span className="font-bold text-[#090f24]">
                {formatNaira(fee)}
              </span>{" "}
              will be charged
            </p>

            <div className="grid grid-cols-4 gap-2 pt-1">

              {QUICK_AMOUNTS.map(
                (amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      setAmount(
                        String(amt)
                      )
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      Number(amount) ===
                      amt
                        ? "bg-[#071b6b] text-white border-[#131e49]"
                        : "bg-gray-50 text-[#090f24] border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {formatNaira(amt)}
                  </button>
                )
              )}

            </div>
          </div>

          {/* Deposit Button */}
          <div className="mt-5">

            <Button
              fullWidth
              size="md"
              isLoading={
                isSubmitting
              }
              onClick={
                handleDeposit
              }
              disabled={
                loadingMinutesDue ||
                membershipUnpaid ||
                minutesUnpaid
              }
              className="bg-[#131e49] hover:bg-[#090f24] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
              }}
            >
              {loadingMinutesDue
                ? "Checking contribution..."
                : minutesUnpaid
                ? "Savings Locked"
                : "Proceed to Payment"}
            </Button>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 pt-4 text-center">
        <p className="text-[10px] text-gray-400">
          Payments are securely processed
          by Flutterwave.
        </p>
      </div>

      {/* =====================================================
          MEMBERSHIP LOCK
      ===================================================== */}

      {membershipUnpaid && (
        <div className="fixed inset-0 z-50 bg-[#090f24]/80 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-[#bdc8f3]/40 animate-in fade-in zoom-in-95 duration-200">

            <button
              onClick={() =>
                navigate(
                  ROUTES.DASHBOARD ||
                    "/dashboard"
                )
              }
              className="absolute top-4 left-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="size-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner mt-2">
              <ShieldCheck className="size-7" />
            </div>

            <div className="space-y-1">

              <h3 className="text-base font-extrabold text-[#090f24]">
                Membership Fee Required
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed">
                Pay{" "}
                <span className="font-bold text-[#090f24]">
                  {formatNaira(
                    MEMBERSHIP_FEE_AMOUNT
                  )}
                </span>{" "}
                to unlock cooperative features,
                including savings deposits and
                loan access.
              </p>

            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-left flex items-start gap-2 border border-amber-200/60">

              <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />

              <p className="text-[10px] text-amber-800 font-medium">
                Deposit transactions remain
                locked until membership activation
                is confirmed.
              </p>

            </div>

            <div className="pt-2 space-y-2">

              <Button
                fullWidth
                size="lg"
                onClick={() =>
                  navigate(
                    ROUTES.MEMBERSHIP_FEE
                  )
                }
                className="bg-[#131e49] hover:bg-[#090f24] text-white font-bold rounded-2xl py-3 shadow-md"
              >
                Go to Membership Fee page
              </Button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    ROUTES.DASHBOARD ||
                      "/dashboard"
                  )
                }
                className="text-xs font-semibold text-gray-500 hover:text-[#090f24] transition-colors py-1 block w-full"
              >
                Return to Dashboard
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SOCKETMINUTES OVERDUE LOCK
      ===================================================== */}

      {!membershipUnpaid &&
        !loadingMinutesDue &&
        minutesUnpaid && (
          <div className="fixed inset-0 z-50 bg-[#090f24]/80 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-[#bdc8f3]/40 animate-in fade-in zoom-in-95 duration-200">

              {/* Back */}
              <button
                onClick={() =>
                  navigate(
                    ROUTES.DASHBOARD ||
                      "/dashboard"
                  )
                }
                className="absolute top-4 left-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>

              {/* Icon */}
              <div className="size-14 rounded-2xl bg-blue-100 text-[#3557d4] flex items-center justify-center mx-auto shadow-inner mt-2">
                <Clock3 className="size-7" />
              </div>

              {/* Message */}
              <div className="space-y-1">

                <h3 className="text-base font-extrabold text-[#090f24]">
                  Outstanding SocketMinutes
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed">

                  You have{" "}
                  <span className="font-bold text-[#090f24]">
                    {minutesDue.monthsDue}
                  </span>{" "}
                  overdue month
                  {overdueMonths === 1
                    ? ""
                    : "s"}.

                </p>

                <p className="text-xl font-extrabold text-[#3557d4] pt-1">
                  {formatNaira(
                    totalMinutesDue
                  )}
                </p>

                <p className="text-[10px] text-gray-500">
                  Total amount required to
                  restore your savings access
                </p>

              </div>

              {/* Breakdown */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-[11px] border border-gray-100">

                {overdueAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Overdue contributions
                    </span>

                    <span className="font-semibold text-[#090f24]">
                      {formatNaira(
                        overdueAmount
                      )}
                    </span>
                  </div>
                )}

                {currentMonthDue > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Current month
                    </span>

                    <span className="font-semibold text-[#090f24]">
                      {formatNaira(
                        currentMonthDue
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-[#090f24]">

                  <span>
                    Total to pay
                  </span>

                  <span className="text-[#3557d4]">
                    {formatNaira(
                      totalMinutesDue
                    )}
                  </span>

                </div>

              </div>

              {/* Warning */}
              <div className="bg-blue-50 rounded-xl p-3 text-left flex items-start gap-2 border border-blue-200/60">

                <Lock className="size-4 text-[#3557d4] shrink-0 mt-0.5" />

                <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                  Your savings balance is safe.
                  You only need to settle your
                  outstanding SocketMinutes
                  contributions before making a
                  new deposit.
                </p>

              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">

                <Button
                  fullWidth
                  size="lg"
                  onClick={() =>
                    navigate(
                      ROUTES.MINUTES ||
                        "/minutes"
                    )
                  }
                  className="bg-[#131e49] hover:bg-[#090f24] text-white font-bold rounded-2xl py-3 shadow-md"
                >
                  Pay{" "}
                  {formatNaira(
                    totalMinutesDue
                  )}{" "}
                  Now
                </Button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      ROUTES.DASHBOARD ||
                        "/dashboard"
                    )
                  }
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