import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  CheckCircle,
  Clock,
  BadgeCheck,
  CalendarDays,
  Hash,
  Users,
  Wallet,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { getGuarantorRequestByToken, respondToGuarantorRequest } from "@/services/guarantor";
import { formatNaira } from "@/utils/format";

export function GuarantorVerify({ pendingRequest, isModal = false, onClose, onRefresh }) {
  const params = useParams();
  const navigate = useNavigate();

  const token = pendingRequest?.verificationToken || params?.token;
  const { data, isLoading, error } = useAsync(
    () => (!pendingRequest && token ? getGuarantorRequestByToken(token) : Promise.resolve(null)),
    [token, pendingRequest]
  );

  // `pendingRequest` (passed in directly, e.g. from a requests list) and
  // the token-fetch response (`data.guarantorRequest`) are both normalized
  // server-side to the same { applicant, loan, guarantorStats, ... } shape
  // now — see getGuarantorDetails / getPendingGuarantorRequests. This was
  // previously the source of the "applicant details missing" bug: the
  // list endpoint used to return raw `applicantId`/`loanId` instead.
  const request = pendingRequest || data?.guarantorRequest;

  const [decision, setDecision] = useState(null); // "accept" | "reject" | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // "accepted" | "rejected"

  // Helper to format remaining time from request.expiresAt
  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return "Awaiting Response";
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const day = d.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
    return `${day}${suffix}, ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
  };

  async function handleAccept() {
    setIsSubmitting(true);
    try {
      await respondToGuarantorRequest({
        token,
        decision: "accept",
      });
      setSubmitted("accepted");
      setDecision(null);
      if (onRefresh) onRefresh();
      if (onClose) setTimeout(onClose, 1500);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Could not submit your response.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setIsSubmitting(true);
    try {
      await respondToGuarantorRequest({
        token,
        decision: "reject",
      });
      setSubmitted("rejected");
      setDecision(null);
      if (onRefresh) onRefresh();
      if (onClose) setTimeout(onClose, 1500);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Could not submit your response.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-[#F8FAFC]">
        <LoadingState rows={4} />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center gap-3 bg-[#F8FAFC]">
        <XCircle className="size-12 text-red-500" />
        <h1 className="text-lg font-bold text-gray-900">Link Invalid or Expired</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          This guarantor request link is no longer valid or has expired. Please contact the applicant to request a new link.
        </p>
      </div>
    );
  }

  const currentStatus = submitted || request.status;

  if (["accepted", "rejected", "expired"].includes(currentStatus)) {
    const isAccepted = currentStatus === "accepted";
    const applicantName = request.applicant?.fullName || "the borrower";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center space-y-4 bg-[#F8FAFC]">
        <div className={`size-16 rounded-full flex items-center justify-center ${isAccepted ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
          {isAccepted ? <CheckCircle2 className="size-10" /> : <XCircle className="size-10" />}
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isAccepted ? "Guarantee Accepted!" : "Request Declined"}
          </h1>
          <p className="text-xs text-gray-500 max-w-xs font-medium leading-relaxed">
            {isAccepted
              ? `You have successfully guaranteed ${applicantName}'s loan application. The request has been forwarded for administrative review.`
              : `You have declined to guarantee ${applicantName}'s loan request. The borrower has been notified.`}
          </p>
        </div>

        {request.loan?.loanNumber && (
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-mono font-bold text-gray-600 border border-gray-200">
            Ref: {request.loan.loanNumber}
          </div>
        )}
      </div>
    );
  }

  // Exact mappings from backend response payload
  const applicant = request.applicant || {};
  const loan = request.loan || {};
  const guarantorStats = request.guarantorStats || {};

  const borrowerName = applicant.fullName || "Unknown Borrower";
  const memberSinceText = formatDate(applicant.memberSince);
  const regNumber = applicant.referralCode;

  const loanType = loan.loanType || "Cooperative Loan";
  const loanAmount = loan.amount ?? 0;
  const tenure = loan.durationMonths ?? 0;
  const interestRateText = loan.interestRate != null
    ? `${loan.interestRate}%`
    : loanAmount > 0 && loan.interest != null
      ? `${Math.round((loan.interest / loanAmount) * 100)}%`
      : "—";
  const dueDateText = formatDate(loan.estimatedDueDate) || "—";
  const totalPayment = loan.totalRepayable ?? 0;

  const remainingTimeText = getRemainingTime(request.expiresAt);

  const summaryCards = [
    {
      key: "standing",
      icon: Users,
      label: "Active Standing",
      value: guarantorStats.activeStanding ?? "—",
      wrapClass: "bg-indigo-50 text-indigo-600",
    },
    {
      key: "loan",
      icon: Wallet,
      label: "Savings ",
      value: guarantorStats.activeGuaranteedAmount != null ? formatNaira(guarantorStats.activeGuaranteedAmount) : "—",
      wrapClass: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "score",
      icon: Gauge,
      label: "Socket Score",
      value: guarantorStats.socketScore != null ? `${guarantorStats.socketScore}%` : "—",
      wrapClass: "bg-sky-50 text-sky-600",
    },
  ];

  const content = (
    <div className={isModal ? "w-full max-w-lg bg-[#F8FAFC] rounded-3xl pb-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200" : "min-h-screen bg-[#F8FAFC] pb-10"}>
      {/* BRAND HEADER */}
      <header
        className="relative px-5 py-6 text-white shadow-lg"
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          background: "linear-gradient(to bottom, #2563eb, #4f46e5 60%, #4338ca)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => (onClose ? onClose() : navigate(-1))}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isModal ? <X className="size-5 text-white" /> : <ArrowLeft className="size-5 text-white" />}
          </button>
          <h1 className="text-lg font-bold text-white text-center flex-1 pr-6">
            Guarantor Acceptance
          </h1>
        </div>
        <p className="text-xs text-center text-blue-100 font-normal">
          Review and accept the loan request
        </p>
      </header>

      {/* MAIN CONTAINER */}
      <div className="px-4 mt-4 space-y-5 max-w-md mx-auto">
        {/* BANNER NOTIFICATION CARD */}
        <Card className="p-4 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
            <BadgeCheck className="size-5 text-[#3b5bdb]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-gray-900 leading-tight">
              You've been selected as a guarantor
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Please review the loan details and accept or decline this request
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-center shrink-0">
            <span className="block text-[9px] font-medium text-[#3b5bdb]">
              Expires in
            </span>
            <span className="block text-xs font-bold text-[#3b5bdb]">
              {remainingTimeText}
            </span>
          </div>
        </Card>

        {/* BORROWER INFORMATION SECTION */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Borrower Information
          </h2>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {applicant.profileImage ? (
                  <img
                    src={applicant.profileImage}
                    alt={borrowerName}
                    className="size-11 rounded-full object-cover border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="size-11 rounded-full bg-[#3b5bdb]/10 border border-[#3b5bdb]/20 flex items-center justify-center text-[#3b5bdb] font-bold text-sm shrink-0">
                    {borrowerName.charAt(0)}
                  </div>
                )}
                <h3 className="text-sm font-bold text-gray-900">{borrowerName}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                  applicant.verified
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                <BadgeCheck className="size-3" /> {applicant.verified ? "Verified" : "Member"}
              </span>
            </div>

            {(memberSinceText || regNumber) && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                {memberSinceText && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                    <Clock className="size-3.5 text-gray-400 shrink-0" />
                    <span>Member Since: <strong className="text-gray-800">{memberSinceText}</strong></span>
                  </div>
                )}
                {regNumber && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                    <Hash className="size-3.5 text-gray-400 shrink-0" />
                    <span>Reg Number: <strong className="text-gray-800">{regNumber}</strong></span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* LOAN DETAILS SECTION */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Loan Details
          </h2>
          <Card className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Loan Type</p>
                <p className="text-xs font-bold text-gray-900 capitalize">{loanType}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Amount</p>
                <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                  {formatNaira(loanAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Loan Tenure</p>
                <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                  {tenure} Month{tenure === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Interest Rate</p>
                <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                  {interestRateText}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-0.5">
                  <CalendarDays className="size-2.5" /> Due Date
                </p>
                <p className="text-xs font-extrabold text-gray-900 mt-0.5">
                  {dueDateText}
                </p>
              </div>
            </div>

            <div className="pt-1 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-semibold">Total Payment</span>
              <span className="text-sm font-extrabold text-emerald-600">
                {formatNaira(totalPayment)}
              </span>
            </div>
          </Card>
        </div>

        {/* GUARANTOR RESPONSIBILITY SECTION */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Guarantor Responsibility
          </h2>
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="size-5" />
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              By accepting, you agree to guarantee this loan. If the borrower defaults, you will be responsible for the full repayment of this loan.
            </p>
          </div>
        </div>

        {/* GUARANTOR SUMMARY SECTION */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Guarantor Summary
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {summaryCards.map(({ key, icon: Icon, label, value, wrapClass }) => (
              <Card key={key} className={`p-3 rounded-2xl text-center space-y-1.5 border-0 ${wrapClass}`}>
                <div className="size-8 mx-auto rounded-full bg-white/70 flex items-center justify-center">
                  <Icon className="size-4" />
                </div>
                <p className="text-sm font-extrabold">{value}</p>
                <p className="text-[9px] font-semibold opacity-80">{label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => setDecision("accept")}
            className="w-full py-3.5 rounded-2xl bg-[#3b5bdb] hover:bg-[#2b44b8] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="size-4" />
            Accept Request
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => setDecision("reject")}
            className="w-full py-3.5 rounded-2xl bg-[#3b5bdb] hover:bg-[#2b44b8] text-white font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <XCircle className="size-4" />
            Decline Request
          </Button>
        </div>
      </div>

      {/* ACCEPT MODAL */}
      {decision === "accept" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Confirm Guarantor Info</h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDecision(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={isSubmitting}
                onClick={() => setDecision(null)}
                className="rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                fullWidth
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={handleAccept}
                className="rounded-2xl bg-[#3b5bdb] hover:bg-[#2b44b8]"
              >
                Confirm & Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {decision === "reject" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Decline Request</h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDecision(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={isSubmitting}
                onClick={() => setDecision(null)}
                className="rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                fullWidth
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={handleReject}
                className="rounded-2xl bg-red-600 hover:bg-red-700 text-white"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return content;
}