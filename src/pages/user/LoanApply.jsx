import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { 
  FileText, 
  User as UserIcon, 
  UserCheck,
  Eye, 
  Send, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  ChevronLeft,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
  TrendingUp,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loanApplicationSchema } from "@/utils/validators";
import { applyForLoan, getLoanEligibility, getActiveLoan } from "@/services/loans";
import { searchGuarantor } from "@/services/guarantor";
import { LOAN_DURATIONS, LOAN_TYPES, DISBURSEMENT_METHODS } from "@/constants/config";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";

const STEPS = [
  { label: "Loan Details", icon: FileText },
  { label: "Personal Info", icon: UserIcon },
  { label: "Guarantor", icon: UserCheck },
  { label: "Review", icon: Eye },
  { label: "Submit", icon: Send },
];

const TIER_LABELS = {
  "1st_tier_70": "First Tier (70%)",
  "2nd_tier_100": "Second Tier (100%)",
  "3rd_tier_150": "Third Tier (150%)",
};

export function LoanApply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittedLoanData, setSubmittedLoanData] = useState(null);
  const [applicationLoanId, setApplicationLoanId] = useState(null);
  const [guarantorStatuses, setGuarantorStatuses] = useState(["pending", "pending", "pending"]);
  const draftKey = `loan-application-draft-${user?._id || "current"}`;
  const restoredDraft = useRef(false);

  // Guarantor lookup states
  const [guarantors, setGuarantors] = useState([null, null, null]);
  const [checkingGuarantor, setCheckingGuarantor] = useState(false);
  const [guarantorErrors, setGuarantorErrors] = useState(["", "", ""]);
  const { data: existingLoan, refetch: refetchExistingLoan } = useAsync(getActiveLoan, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      durationMonths: 3,
      loanType: "cooperative",
      disbursementMethod: "bank_transfer",
      amount: "",
      purpose: "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      occupation: user?.occupation || "",
      guarantorReferralCodes: ["", "", ""],
    },
  });

  const watchedAmount = watch("amount");
  const watchedDuration = watch("durationMonths");
  const watchedLoanType = watch("loanType");
  const watchedGuarantorCodes = watch("guarantorReferralCodes") || ["", "", ""];
  const guarantorCodesKey = watchedGuarantorCodes.join("|");

  useEffect(() => {
    let draft = null;
    try {
      draft = JSON.parse(localStorage.getItem(draftKey) || "null");
    } catch {
      localStorage.removeItem(draftKey);
    }
    if (draft) {
      Object.entries(draft.values || {}).forEach(([name, value]) => setValue(name, value));
      setStep(Number.isInteger(draft.step) ? draft.step : 0);
      setApplicationLoanId(draft.loanId || null);
      setGuarantorStatuses(draft.guarantorStatuses || ["pending", "pending", "pending"]);
    }
    restoredDraft.current = true;
  }, [draftKey, setValue]);

  useEffect(() => {
    if (restoredDraft.current) {
      let previousDraft = null;
      try {
        previousDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
      } catch {
        previousDraft = null;
      }
      localStorage.setItem(draftKey, JSON.stringify({
        step,
        values: getValues(),
        loanId: applicationLoanId || previousDraft?.loanId || null,
        guarantorStatuses,
      }));
    }
  }, [draftKey, step, getValues, applicationLoanId, guarantorStatuses]);

 useEffect(() => {
  if (!existingLoan) return;

  const submittedStatuses = [
    "waiting_guarantor",
    "pending_review",
    "approved",
    "active",
    "disbursed",
    "repaying",
  ];

  // If there is an active/submitted loan application,
  // restore it instead of clearing the application.
  if (submittedStatuses.includes(existingLoan.status)) {
    setSubmittedLoanData(existingLoan);
    setApplicationLoanId(existingLoan._id);

    setGuarantorStatuses(
      (existingLoan.guarantors || []).map(
        (item) => item.status || "pending"
      )
    );

    existingLoan.guarantors?.forEach((item, index) => {
      if (item.referralCode) {
        setValue(
          `guarantorReferralCodes.${index}`,
          item.referralCode
        );
      }
    });

    /*
     * IMPORTANT:
     * After submission, don't force the applicant back
     * into the guarantor-entry process.
     */
    if (existingLoan.status === "waiting_guarantor") {
      setStep(4);
    } else if (existingLoan.status === "pending_review") {
      setStep(4);
    } else {
      setStep(4);
    }

    return;
  }

  // Only clear/reset when the previous application
  // has actually been cancelled/rejected/completed.
  if (
    existingLoan.status === "cancelled" ||
    existingLoan.status === "rejected" ||
    existingLoan.status === "completed"
  ) {
    localStorage.removeItem(draftKey);

    setApplicationLoanId(null);
    setSubmittedLoanData(null);
    setGuarantorStatuses(["pending", "pending", "pending"]);
    setGuarantors([null, null, null]);
    setStep(0);

    reset({
      durationMonths: 3,
      loanType: "cooperative",
      disbursementMethod: "bank_transfer",
      amount: "",
      purpose: "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      occupation: user?.occupation || "",
      guarantorReferralCodes: ["", "", ""],
    });
  }
}, [draftKey, existingLoan, reset, setValue, user]);
  
useEffect(() => {
  if (!submittedLoanData) return undefined;

  const statusesToWatch = [
    "waiting_guarantor",
    "pending_review",
  ];

  if (!statusesToWatch.includes(submittedLoanData.status)) {
    return undefined;
  }

  const timer = setInterval(async () => {
    try {
      const result = await refetchExistingLoan();

      const refreshedLoan = result?.data || result;

      if (!refreshedLoan) return;

      setSubmittedLoanData(refreshedLoan);
      setApplicationLoanId(refreshedLoan._id);

      setGuarantorStatuses(
        (refreshedLoan.guarantors || []).map(
          (item) => item.status || "pending"
        )
      );

      // Keep the applicant on the submitted/status screen.
      if (
        refreshedLoan.status === "waiting_guarantor" ||
        refreshedLoan.status === "pending_review"
      ) {
        setStep(4);
      }
    } catch (error) {
      console.error("Failed to refresh loan status:", error);
    }
  }, 10000);

  return () => clearInterval(timer);
}, [submittedLoanData?.status, refetchExistingLoan]);


  useEffect(() => {
    if (user) {
      setValue("fullName", user.fullName || "");
      setValue("email", user.email || "");
      setValue("phone", user.phone || "");
      setValue("address", user.address || "");
      setValue("occupation", user.occupation || "");
    }
  }, [user, setValue]);

  useEffect(() => {
    async function fetchEligibility() {
      try {
        const res = await getLoanEligibility();
        const data = res?.eligibility || res;
        setEligibility(data);
      } catch (error) {
        toast.error("Failed to load eligibility details");
      } finally {
        setLoading(false);
      }
    }
    fetchEligibility();
  }, []);

  // Validate each guarantor referral code independently.
  useEffect(() => {
    const cleanCodes = watchedGuarantorCodes.map((code) => (code || "").trim().toUpperCase());
    const timeout = setTimeout(async () => {
      setCheckingGuarantor(true);
      const results = await Promise.all(cleanCodes.map(async (code, index) => {
        if (code.length < 3) return { guarantor: null, error: "" };
        try {
          const res = await searchGuarantor(code);
          return { guarantor: res?.guarantor || res, error: "" };
        } catch (err) {
          return { guarantor: null, error: err?.data?.message || err?.message || "Guarantor not eligible or found" };
        }
      }));
      setGuarantors(results.map((result) => result.guarantor));
      setGuarantorErrors(results.map((result) => result.error));
      setCheckingGuarantor(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [guarantorCodesKey]);

  // Calculations driven entirely by backend state
  const principal = Number(watchedAmount || 0);
  const maxLimit = eligibility?.maxLoanAmount || 0;
  const isOverLimit = maxLimit > 0 && principal > maxLimit;
  const remainingCapacity = Math.max(0, maxLimit - principal);
  const capacityProgress = maxLimit > 0 ? Math.min(100, Math.round((principal / maxLimit) * 100)) : 0;

  // Backend dynamic quick amounts
  const quickAmounts = maxLimit > 0 
    ? [0.25, 0.5, 0.75, 1]
        .map((factor) => Math.floor((maxLimit * factor) / 1000) * 1000)
        .filter((val, index, self) => val > 0 && self.indexOf(val) === index)
    : [];

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 0) {
      fieldsToValidate = ["loanType", "amount", "durationMonths", "disbursementMethod", "purpose"];
    } else if (step === 1) {
      fieldsToValidate = ["fullName", "email", "phone", "address", "occupation"];
    } else if (step === 2) {
  /*
   * Once the loan has been submitted, the guarantor
   * verification process is finished.
   *
   * Do NOT ask the applicant to enter the codes again.
   */
  if (applicationLoanId) {
    setStep(4);
    return;
  }

  fieldsToValidate = ["guarantorReferralCodes"];

  if (checkingGuarantor) {
    toast.error("Validating guarantor referral code...");
    return;
  }

  const normalizedCodes = watchedGuarantorCodes.map((code) =>
    (code || "").trim().toUpperCase()
  );

  const hasThreeUniqueCodes =
    normalizedCodes.length === 3 &&
    normalizedCodes.every(Boolean) &&
    new Set(normalizedCodes).size === 3;

  const allGuarantorsVerified =
    guarantors.length === 3 &&
    guarantors.every(Boolean);

  if (!hasThreeUniqueCodes || !allGuarantorsVerified) {
    toast.error(
      guarantorErrors.find(Boolean) ||
      "Please enter three valid and eligible guarantor codes."
    );
    return;
  }
}

    const isValid = await trigger(fieldsToValidate);

    if (step === 0 && isOverLimit) {
      toast.error(`Requested amount exceeds borrowing limit of ${formatNaira(maxLimit)}`);
      return;
    }

    if (isValid) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } else {
      toast.error("Please resolve form errors before continuing");
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmitFinal = async (data) => {
    if (!eligibility?.isEligible) {
      toast.error("You are currently not eligible to request a loan.");
      return;
    }

    if (isOverLimit) {
      toast.error(`Cannot submit: Amount exceeds maximum limit of ${formatNaira(maxLimit)}`);
      return;
    }

    if (guarantors.some((guarantor) => !guarantor)) {
      toast.error("Three valid and eligible guarantors are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: Number(data.amount),
        durationMonths: Number(data.durationMonths),
        loanType: data.loanType,
        disbursementMethod: data.disbursementMethod,
        purpose: data.purpose,
        guarantorReferralCodes: data.guarantorReferralCodes.map((code, index) => (guarantors[index]?.referralCode || code).trim().toUpperCase()),
      };

     const res = await applyForLoan(payload);

if (res) {
  const submittedLoan = res?.loan || res;

  toast.success(
    "Loan application submitted. Your guarantors have been notified."
  );

  setSubmittedLoanData(submittedLoan);
  setApplicationLoanId(submittedLoan?._id || null);

  const statuses =
    (submittedLoan?.guarantors || []).map(
      (item) => item.status || "pending"
    );

  setGuarantorStatuses(statuses);

  /*
   * The application has now been submitted.
   *
   * Do NOT send another request from the frontend.
   * Backend applyForLoan() handles guarantor notification.
   */
  localStorage.setItem(
    draftKey,
    JSON.stringify({
      step: 4,
      values: data,
      loanId: submittedLoan?._id || null,
      guarantorStatuses: statuses,
    })
  );

  /*
   * IMPORTANT:
   * Go directly to the submitted/waiting screen.
   * The applicant should not be asked to enter
   * the guarantor codes again.
   */
  setStep(4);
}
    } catch (err) {
      if (err?.data?.errors && typeof err.data.errors === "object") {
        Object.values(err.data.errors).forEach((message) => toast.error(String(message)));
      } else {
        toast.error(err?.data?.message || err?.message || "Failed to submit loan application");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalidForm = (formErrors) => {
    console.error("Form Validation Errors:", formErrors);
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      toast.error(`Error in ${firstErrorKey}: ${formErrors[firstErrorKey]?.message || "Invalid value"}`);
    }
  };

  const currentValues = getValues();
  const tierDisplay = TIER_LABELS[eligibility?.tierName] || eligibility?.tierName || "N/A";

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#090F47]">1. Loan Details</h2>
                <p className="text-xs text-gray-500">Tell us what you need</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#090F47] mb-1.5 block">Loan Type</label>
                <select
                  {...register("loanType")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm font-medium text-[#090F47] focus:outline-none focus:border-[#090F47]"
                >
                  {LOAN_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#090F47] mb-1.5 block">Enter Amount</label>
                <div className="flex gap-2 items-center">
                  <div className="px-4 py-3 bg-[#090F47]/5 border border-gray-200 rounded-xl font-bold text-[#090F47]">
                    ₦
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...register("amount")}
                    error={errors.amount?.message}
                    className="flex-1 bg-gray-50/50 text-[#090F47] font-bold"
                  />
                </div>

                {quickAmounts.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setValue("amount", amt, { shouldValidate: true })}
                        className="py-2 px-1 text-center rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-[#090F47] hover:bg-[#090F47] hover:text-white transition-all"
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Real-time Borrowing Capacity Progress Bar */}
                {principal > 0 && maxLimit > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-[#090F47]">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3 text-[#090F47]" /> Borrowing Capacity Used
                      </span>
                      <span>
                        {formatNaira(principal)} / {formatNaira(maxLimit)}
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isOverLimit ? "bg-red-500" : "bg-[#090F47]"
                        }`}
                        style={{ width: `${Math.min(100, capacityProgress)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Remaining Capacity: {formatNaira(remainingCapacity)}</span>
                      {isOverLimit && <span className="text-red-600 font-bold">Exceeds Cap</span>}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Loan Purpose"
                  placeholder="e.g. Business Expansion, School Fees"
                  {...register("purpose")}
                  error={errors.purpose?.message}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#090F47] mb-1.5 block">Repayment Period</label>
                <select
                  {...register("durationMonths")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm font-medium text-[#090F47] focus:outline-none focus:border-[#090F47]"
                >
                  {LOAN_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#090F47] mb-1.5 block">Disbursement Method</label>
                <select
                  {...register("disbursementMethod")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm font-medium text-[#090F47] focus:outline-none focus:border-[#090F47]"
                >
                  {DISBURSEMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#090F47]">2. Personal Info</h2>
                <p className="text-xs text-gray-500">Confirm your profile details</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 size-4 text-gray-400" />
                  <Input
                    {...register("fullName")}
                    placeholder="Full Name"
                    error={errors.fullName?.message}
                    className="pl-10 bg-gray-50/50 text-[#090F47]"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-gray-400" />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="Email Address"
                    error={errors.email?.message}
                    className="pl-10 bg-gray-50/50 text-[#090F47]"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 size-4 text-gray-400" />
                  <Input
                    {...register("phone")}
                    placeholder="Phone Number"
                    error={errors.phone?.message}
                    className="pl-10 bg-gray-50/50 text-[#090F47]"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 size-4 text-gray-400" />
                  <Input
                    {...register("address")}
                    placeholder="Residential Address"
                    error={errors.address?.message}
                    className="pl-10 bg-gray-50/50 text-[#090F47]"
                  />
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 size-4 text-gray-400" />
                  <Input
                    {...register("occupation")}
                    placeholder="Occupation / Business Name"
                    error={errors.occupation?.message}
                    className="pl-10 bg-gray-50/50 text-[#090F47]"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#090F47]">3. Guarantor Verification</h2>
                <p className="text-xs text-gray-500">Provide referral codes for three eligible cooperative guarantors</p>
              </div>

              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <Input
                    label={`Guarantor ${index + 1} Referral Code`}
                    placeholder="SM12345"
                    {...register(`guarantorReferralCodes.${index}`)}
                    disabled={Boolean(applicationLoanId)}
                    className="uppercase font-semibold tracking-wider"
                  />
                  {checkingGuarantor && watchedGuarantorCodes[index]?.trim().length >= 3 && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="size-3.5 animate-spin" /> Verifying guarantor eligibility...
                    </p>
                  )}
                  {guarantors[index] && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
                      <span className="font-bold">Eligible:</span> {guarantors[index].fullName} ({guarantors[index].referralCode})
                    </div>
                  )}
                  {!checkingGuarantor && guarantorErrors[index] && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
                      {guarantorErrors[index]}
                    </div>
                  )}
                </div>
              ))}
{guarantors.every(Boolean) && !applicationLoanId && (
  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
    All three guarantors have been verified and are eligible. 
    You can now continue to review and submit your loan application.
  </p>
)}
              {applicationLoanId && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  <p className="font-bold">Guarantor progress</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {guarantorStatuses.map((status, index) => (
                      <div key={index} className="rounded-lg bg-white/70 p-2 text-center">
                        <span className="block text-[10px] text-blue-600">Guarantor {index + 1}</span>
                        <span className={`mt-1 block text-[10px] font-bold capitalize ${status === "accepted" ? "text-emerald-600" : status === "rejected" ? "text-red-600" : "text-amber-600"}`}>
                          {status || "pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2">You can leave this page. Your progress and responses will remain available when you return.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Limit Warning Banner */}
            {isOverLimit && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-center gap-2 text-xs text-red-700">
                <AlertTriangle className="size-4 shrink-0 text-red-500" />
                <span>
                  Requested amount (<strong>{formatNaira(principal)}</strong>) exceeds maximum limit of <strong>{formatNaira(maxLimit)}</strong>.
                </span>
              </div>
            )}

            {/* Editable Review Details Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-bold text-[#090F47]">Review & Edit Loan</h3>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Auto Updating
                </span>
              </div>

              {/* Borrowing Capacity Progress Indicator */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-500">Borrowing Capacity</span>
                  <span className="font-bold text-[#090F47]">
                    {formatNaira(principal)} / {formatNaira(maxLimit)}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOverLimit ? "bg-red-500" : "bg-[#090F47]"}`}
                    style={{ width: `${Math.min(100, capacityProgress)}%` }}
                  />
                </div>
              </div>

              {/* Editable Amount and Duration Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Requested Amount (₦)</label>
                  <Input
                    type="number"
                    {...register("amount")}
                    className="bg-gray-50 text-xs font-bold text-[#090F47]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Repayment Period</label>
                  <select
                    {...register("durationMonths")}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold text-[#090F47] focus:outline-none"
                  >
                    {LOAN_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Driven Tier and Limits */}
              <div className="grid grid-cols-2 gap-3 text-xs border-y py-3">
                <div className="p-2.5 bg-gray-50/60 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">Borrowing Tier</span>
                  <p className="font-bold text-[#090F47]">{tierDisplay}</p>
                </div>

                <div className="p-2.5 bg-gray-50/60 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">Maximum Allowed</span>
                  <p className="font-bold text-[#090F47]">{formatNaira(maxLimit)}</p>
                </div>

                <div className="p-2.5 bg-gray-50/60 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">Requested</span>
                  <p className="font-bold text-[#090F47]">{formatNaira(principal)}</p>
                </div>

                <div className="p-2.5 bg-gray-50/60 rounded-xl">
                  <span className="text-gray-400 block text-[10px]">Remaining Capacity</span>
                  <p className="font-bold text-emerald-600">{formatNaira(remainingCapacity)}</p>
                </div>
              </div>

              <div className="pt-1 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Total Loan Principal</span>
                <span className="text-sm font-extrabold text-[#090F47]">{formatNaira(principal)}</span>
              </div>
            </div>

            {/* Personal Details Breakdown */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-sm font-bold text-[#090F47] border-b pb-2">Personal Info</h3>
              <div className="grid grid-cols-3 gap-3 text-left">
                <div>
                  <span className="text-[11px] text-gray-400 block">Full Name</span>
                  <p className="text-xs font-bold text-[#090F47]">{currentValues.fullName || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-gray-400 block">Email</span>
                  <p className="text-xs font-bold text-[#090F47] truncate">{currentValues.email || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-left pt-2">
                <div>
                  <span className="text-[11px] text-gray-400 block">Phone</span>
                  <p className="text-xs font-bold text-[#090F47]">{currentValues.phone || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-gray-400 block">Address</span>
                  <p className="text-xs font-bold text-[#090F47] truncate">{currentValues.address || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Guarantor Details Breakdown */}
            {guarantors.some(Boolean) && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                <h3 className="text-sm font-bold text-[#090F47] border-b pb-2">Guarantor Info</h3>
                <div className="space-y-2 text-left text-xs">
                  {guarantors.map((item, index) => item && (
                    <div key={item.id || item._id || index} className="flex items-center justify-between">
                      <span className="text-gray-400">Guarantor {index + 1}: <strong className="text-[#090F47]">{item.fullName}</strong></span>
                      <span className="font-bold text-emerald-600">Eligible</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center space-y-5 my-2">
            {/* Green Starburst Check Badge */}
            <div className="relative size-28 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-[#10B981] fill-current">
                <path d="M50 0 L59 13 L75 6 L78 22 L94 22 L90 38 L100 50 L90 62 L94 78 L78 78 L75 94 L59 87 L50 100 L41 87 L25 94 L22 78 L6 78 L10 62 L0 50 L10 38 L6 22 L22 22 L25 6 L41 13 Z" />
              </svg>
              <svg
                className="absolute size-12 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#090F47]">Thank You</h2>
              {submittedLoanData?.loanNumber && (
                <p className="text-xs font-mono font-bold text-gray-500">
                  Ref No: {submittedLoanData.loanNumber}
                </p>
              )}
             <p className="text-xs text-gray-500 max-w-60 mx-auto font-medium leading-relaxed pt-1">
  {submittedLoanData?.status === "waiting_guarantor"
    ? "Your application has been submitted. Your three guarantors have been notified and must respond."
    : submittedLoanData?.status === "pending_review"
      ? "All three guarantors have accepted your application. It is now waiting for admin review and activation."
      : submittedLoanData?.status === "approved"
        ? "Your loan has been approved and is ready for the next processing stage."
        : submittedLoanData?.status === "active"
          ? "Your loan is active. Your repayment schedule is now available."
          : "Your loan application has been submitted successfully."}
</p>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 p-4 text-left space-y-3 shadow-sm mt-4">
              <h3 className="text-xs font-bold text-[#090F47] border-b pb-2">Application Summary</h3>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Loan Type</span>
                <span className="font-bold text-[#090F47] capitalize">
                  {LOAN_TYPES.find((t) => t.value === watchedLoanType)?.label || watchedLoanType} Loan
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Requested Amount</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatNaira(principal)}
                </span>
              </div>
            </div>
{submittedLoanData?.guarantors?.length > 0 && (
  <div className="rounded-2xl bg-white border border-gray-100 p-4 text-left space-y-3 shadow-sm">
    <h3 className="text-xs font-bold text-[#090F47] border-b pb-2">
      Guarantor Approval Status
    </h3>

    <div className="space-y-2">
      {submittedLoanData.guarantors.map((guarantor, index) => {
        const status = guarantor.status || "pending";

        return (
          <div
            key={guarantor._id || index}
            className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
          >
            <div>
              <p className="text-xs font-bold text-[#090F47]">
                Guarantor {index + 1}
              </p>

              <p className="text-[10px] text-gray-500">
                {guarantor.fullName ||
                  guarantor.name ||
                  "Guarantor"}
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                status === "accepted"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {status}
            </span>
          </div>
        );
      })}
    </div>

    {submittedLoanData.status === "waiting_guarantor" && (
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
        <Clock className="size-4 text-amber-600 mt-0.5 shrink-0" />

        <p className="text-[10px] leading-relaxed text-amber-800">
          Your application is waiting for all three guarantors to respond.
          You do not need to enter their codes again.
        </p>
      </div>
    )}

    {submittedLoanData.status === "pending_review" && (
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3">
        <ShieldCheck className="size-4 text-blue-600 mt-0.5 shrink-0" />

        <p className="text-[10px] leading-relaxed text-blue-800">
          All three guarantors have accepted your loan application.
          Your application has been forwarded for admin review.
        </p>
      </div>
    )}

    {submittedLoanData.status === "cancelled" && (
      <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
        <XCircle className="size-4 text-red-600 mt-0.5 shrink-0" />

        <p className="text-[10px] leading-relaxed text-red-800">
          This loan application was cancelled because one or more
          guarantors rejected the request.
        </p>
      </div>
    )}
  </div>
)}
            <Button 
              fullWidth 
              className="bg-[#090F47] hover:bg-[#090F47]/90 text-white font-semibold py-3.5 rounded-xl text-sm"
              onClick={() => navigate(ROUTES.LOANS || "/loans")}
            >
              Done
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xs text-gray-400 font-medium">Loading details...</p>
      </div>
    );
  }

  // Full Screen Block for Non-Eligible Users
  if (eligibility && !eligibility.isEligible) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] p-5 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-red-100 rounded-3xl p-6 shadow-sm text-center space-y-5">
          <div className="size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Ban className="size-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#090F47]">You are currently not eligible for a loan</h2>
            <p className="text-xs text-gray-500">
              Review your current account requirements below:
            </p>
          </div>

          <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 text-left space-y-3">
            <h3 className="text-xs font-bold text-red-900 border-b border-red-100 pb-2 flex items-center gap-1.5">
              <XCircle className="size-4 text-red-500" /> Unsatisfied Eligibility Rules
            </h3>

            <div className="space-y-2.5 text-xs text-red-800">
              <div className="flex items-center justify-between border-b border-red-100/60 pb-1.5">
                <span>Minimum Savings Required</span>
                <div className="text-right">
                  <span className="font-bold">{formatNaira(eligibility.minSavings)}</span>
                  <p className="text-[10px] text-red-500">
                    Current: {formatNaira(eligibility.netSavings)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-red-100/60 pb-1.5">
                <span>Minimum Savings Duration</span>
                <div className="text-right">
                  <span className="font-bold">{eligibility.minMonths} Months</span>
                  <p className="text-[10px] text-red-500">
                    Current: {eligibility.monthsCount ?? 0} Months
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Savings Consistency Requirement</span>
                <span className={`font-bold ${eligibility.isConsistent ? "text-emerald-700" : "text-red-600"}`}>
                  {eligibility.isConsistent ? "✓ Met" : "✕ Not Met"}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={() => navigate(ROUTES.LOANS || "/loans")} className="w-full bg-[#090F47] py-3.5 rounded-xl text-white font-bold text-sm">
            Return to Loans Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD]">
      {/* Primary Brand Top Banner (#090F47) */}
      <div className="bg-[#090F47] text-white pt-4 pb-20 px-5 rounded-b-[1.75rem] relative"  style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }} >
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => (step > 0 && step < 4 ? prevStep() : navigate(-1))} 
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="size-6 text-white" />
          </button>
          <h1 className="text-base font-bold text-center flex-1 pr-7">Apply for Loan</h1>
        </div>

        {/* Backend-driven Borrowing Eligibility Top Banner in Header */}
        {/* {eligibility && eligibility.isEligible && step < 4 && (
          <div className="mt-4 bg-white/10 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Award className="size-4 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Borrowing Eligibility
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                ✓ Eligible
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                <span className="text-gray-300 block text-[10px]">Current Tier</span>
                <strong className="text-white font-bold">{tierDisplay}</strong>
              </div>

              <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                <span className="text-gray-300 block text-[10px]">Completed Loans</span>
                <strong className="text-white font-bold">{eligibility.completedLoansCount ?? 0}</strong>
              </div>

              <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                <span className="text-gray-300 block text-[10px]">Savings Duration</span>
                <strong className="text-white font-bold">{eligibility.monthsCount ?? 0} Months</strong>
              </div>

              <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                <span className="text-gray-300 block text-[10px]">Net Savings</span>
                <strong className="text-white font-bold">{formatNaira(eligibility.netSavings)}</strong>
              </div>
            </div>

            <div className="flex justify-between items-center bg-black/30 p-2 rounded-xl border border-white/10 text-xs">
              <span className="text-gray-200">Maximum Borrowing</span>
              <strong className="text-emerald-400 text-sm font-extrabold">{formatNaira(maxLimit)}</strong>
            </div>
          </div>
        )} */}

        {/* Floating Stepper Indicator Bar */}
        <div className="absolute -bottom-10 left-5 right-5 bg-white rounded-xl p-2.5 shadow-md border border-gray-100 flex justify-between items-center z-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i <= step;
            return (
              <div key={i} className="flex flex-col items-center flex-1 relative">
                <div
                  className={`size-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                    active ? "bg-[#5B76E1] text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon className="size-3.5" />
                </div>
                <span
                  className={`text-[8px] mt-1 font-semibold ${
                    active ? "text-[#090F47]" : "text-gray-400"
                  }`}
                >
                  {i + 1}. {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="px-5 mt-16 pb-10">
        <form onSubmit={handleSubmit(onSubmitFinal, onInvalidForm)}>
          {renderStepContent()}

          {!isLastStep && (
            <div className="flex gap-3 mt-6">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={prevStep}
                  className="border-[#090F47] text-[#090F47]"
                >
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button
  type="button"
  fullWidth
  onClick={handleNext}
  disabled={
    step === 2 &&
    (
      applicationLoanId ||
      guarantors.some((item) => !item) ||
      checkingGuarantor
    )
  }
  className="bg-[#090F47] hover:bg-[#5B76E1]/90 text-white font-medium disabled:opacity-50"
>
  Continue
</Button>
              ) : (
                <Button
                  type="submit"
                  fullWidth
                  disabled={isOverLimit || isSubmitting}
                  isLoading={isSubmitting}
                  className="bg-[#090F47] hover:bg-[#090F47]/90 text-white font-medium disabled:opacity-50"
                >
                  Submit Application
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}