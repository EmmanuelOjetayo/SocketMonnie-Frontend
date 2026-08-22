import { useState } from "react";
import toast from "react-hot-toast";
import {
  FileCheck,
  UserCheck,
  Banknote,
  ShieldAlert,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { respondToGuarantorRequest } from "@/services/guarantor";
import { formatNaira } from "@/utils/format";

export function GuarantorOverlay({ pendingRequest, onClose, onRefresh }) {
  const [decision, setDecision] = useState(null); // "accept" | "reject" | null
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingRequest) return null;

  const applicant = pendingRequest.applicantId || {};
  const loan = pendingRequest.loanId || {};
  const token = pendingRequest.verificationToken;

  const borrowerName = applicant.fullName || "Member";
  const loanNumber = loan.loanNumber || "N/A";
  const loanAmount = loan.principalAmount || loan.amount || 0;
  const tenure = loan.durationMonths || 0;
  const totalPayment = loan.totalRepayable || 0;

  async function handleAccept() {
    setIsSubmitting(true);
    try {
      await respondToGuarantorRequest({
        token,
        decision: "accept",
      });
      toast.success("Guarantee accepted successfully!");
      setDecision(null);
      if (onRefresh) onRefresh();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Could not accept request.");
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
      toast.success("Guarantee request declined.");
      setDecision(null);
      if (onRefresh) onRefresh();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Could not decline request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-[#3b5bdb]/10 flex items-center justify-center text-[#3b5bdb]">
              <FileCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">
                Guarantor Request Pending
              </h2>
              <p className="text-[11px] text-gray-500">
                You have been selected as a loan guarantor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Borrower Info Card */}
        <Card className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-[#3b5bdb]/15 flex items-center justify-center text-[#3b5bdb] font-bold text-xs">
                {borrowerName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">{borrowerName}</h3>
                <p className="text-[10px] text-gray-400 font-mono">Ref: {loanNumber}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
              <UserCheck className="size-3" /> Borrower
            </span>
          </div>
        </Card>

        {/* Loan Details Grid */}
        <div className="grid grid-cols-3 gap-2 text-center bg-blue-50/50 p-3 rounded-2xl border border-blue-100/60">
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Principal</p>
            <p className="text-xs font-extrabold text-gray-900 mt-0.5">{formatNaira(loanAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Tenure</p>
            <p className="text-xs font-extrabold text-gray-900 mt-0.5">{tenure} Months</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Repayable</p>
            <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{formatNaira(totalPayment)}</p>
          </div>
        </div>

        {/* Guarantor Responsibility Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
          <ShieldAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 leading-snug">
            <p className="font-bold text-amber-950">Guarantor Commitment Notice</p>
            <p className="text-amber-800 mt-0.5">
              By accepting, you agree to guarantee this loan. If the borrower defaults on monthly dues, your share will be automatically deducted from your savings until resolved.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => setDecision("accept")}
            className="py-3 rounded-2xl bg-[#3b5bdb] hover:bg-[#2b44b8] text-white font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="size-4" />
            Accept Request
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => setDecision("reject")}
            className="py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs border border-gray-200 flex items-center justify-center gap-1.5"
          >
            <XCircle className="size-4 text-gray-500" />
            Decline
          </Button>
        </div>

        {/* Confirm Modal Sub-dialog */}
        {decision && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3">
              <h3 className="text-sm font-bold text-gray-900">
                {decision === "accept" ? "Confirm Guarantee Acceptance" : "Confirm Decline"}
              </h3>
              <p className="text-xs text-gray-500">
                {decision === "accept"
                  ? `Are you sure you want to accept responsibility as guarantor for ${borrowerName}?`
                  : `Are you sure you want to decline this request?`}
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={() => setDecision(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  fullWidth
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={decision === "accept" ? handleAccept : handleReject}
                  className={decision === "accept" ? "bg-[#3b5bdb]" : "bg-red-600 hover:bg-red-700 text-white"}
                >
                  {decision === "accept" ? "Confirm & Accept" : "Decline Request"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
