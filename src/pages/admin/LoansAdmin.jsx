import { useState, useCallback, useRef } from "react";
import {
  Search,
  Eye,
  XCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  Bell,
  Clock,
  Shield,
  CreditCard,
  Building2,
  DollarSign,
  AlertTriangle,
  User,
  ChevronRight,
  Calendar,
  Filter,
  CheckCircle2,
  Target,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, statusToBadgeProps } from "@/components/ui/Badge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { useAsync } from "@/hooks/useAsync";
import {
  getAdminLoans,
  approveLoan,
  rejectLoan,
  getLoanById,
} from "@/services/adminService";
import toast from "react-hot-toast";
import { formatNaira, formatDate } from "@/utils/format";

// ─── TOP HEADER COMPONENT ────────────────────────────────
function AdminHeader({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(query);
    }
  };

  return (
    <header 
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-5 text-white shadow-md rounded-b-[24px]"
      style={{
        background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
      }}
    >
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 size-4 text-[#dee3f9]/70" />
          <input
            type="text"
            placeholder="Search loan #, member name... (Press Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-[#bdc8f3]/30 bg-white/10 py-2 pl-9 pr-4 text-xs font-medium text-white placeholder:text-[#dee3f9]/60 backdrop-blur-md transition-all focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300 sm:flex">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          System Active
        </div>

        <button className="relative rounded-full p-2 text-[#dee3f9] hover:bg-white/10 transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-400" />
        </button>
      </div>
    </header>
  );
}

// ─── PREREQUISITE ITEM CHECK ─────────────────────────────
function PrereqItem({ label, met }) {
  return (
    <div className="flex items-center justify-between border-b border-[#dee3f9]/50 py-1.5 text-xs last:border-0">
      <span className={met ? "font-semibold text-[#090f24]" : "text-gray-400"}>
        {label}
      </span>
      {met ? (
        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 text-[11px]">
          <CheckCircle2 className="size-3.5" /> Verified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-extrabold text-rose-500 text-[11px]">
          <XCircle className="size-3.5" /> Missing
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export function AdminLoans() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data Fetching
  const { data, isLoading, refetch } = useAsync(
    () => getAdminLoans({ status: statusFilter, search, page, limit }),
    [statusFilter, search, page]
  );

  // Response Payload Normalization
  const loans = data?.loans || data?.data?.loans || data?.data || [];
  const pagination = data?.pagination || data?.data?.pagination || {};
  const totalCount = pagination.total || loans.length;

  // Detail Sheet State
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loanDetail, setLoanDetail] = useState(null);

  // Per-Action Loading Indicators
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal Targets
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const activeRequestId = useRef(0);

  // Load Full Details
  const openDetail = useCallback(async (loanId) => {
    const currentReq = ++activeRequestId.current;
    setSelectedLoanId(loanId);
    setDetailLoading(true);
    setLoanDetail(null);

    try {
      const res = await getLoanById(loanId);
      if (currentReq === activeRequestId.current) {
        setLoanDetail(res?.loan || res?.data || res);
      }
    } catch (err) {
      if (currentReq === activeRequestId.current) {
        toast.error("Failed to load loan details");
        setSelectedLoanId(null);
      }
    } finally {
      if (currentReq === activeRequestId.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  // Sync Open Detail After Action
  const refreshDetailInPlace = async (loanId) => {
    try {
      const res = await getLoanById(loanId);
      setLoanDetail(res?.loan || res?.data || res);
    } catch (err) {
      setSelectedLoanId(null);
    }
  };

  // Confirm status flow
  const confirmApprove = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      const res = await approveLoan(approveTarget);
      toast.success(res?.message || "Loan confirmed and activated.");
      setApproveTarget(null);
      await refetch();
      if (selectedLoanId) await refreshDetailInPlace(selectedLoanId);
    } catch (error) {
      toast.error(
        error?.data?.message || error?.response?.data?.message || "Failed to confirm loan."
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Confirm Reject Flow
  const confirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setIsRejecting(true);
    try {
      await rejectLoan(rejectTarget, rejectReason.trim());
      toast.success("Loan rejected.");
      setRejectTarget(null);
      setRejectReason("");
      await refetch();
      if (selectedLoanId) await refreshDetailInPlace(selectedLoanId);
    } catch (error) {
      toast.error(
        error?.data?.message || error?.response?.data?.message || "Failed to reject loan."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  // Extract User Context safely
  const memberObj = loanDetail?.userId || loanDetail?.user || {};
  const bankInfo = memberObj.bankDetails || loanDetail?.bankDetails || {};
  const installments = loanDetail?.installments || loanDetail?.repaymentSchedule || [];

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* Top Navigation */}
      <AdminHeader
        onSearch={(q) => setSearch(q)}
      />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6 pt-1">
        
        {/* Loan Operations Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: "linear-gradient(135deg, #1d2d6d 0%, #131e49 50%, #090f24 100%)",
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[#dee3f9]">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold">Loan Administration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Loan Applications
            </h1>
            <p className="mt-0.5 text-xs text-[#dee3f9]/80">
              Review member requests, assess eligibility prerequisites, and issue approvals.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-block rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold text-[#dee3f9]">
              {totalCount} Total Applications
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1">
            <Input
              placeholder="Search by name, loan ID..."
              icon={Search}
              className="rounded-2xl border-[#bdc8f3]/40 bg-white text-xs shadow-sm focus:ring-[#131e49]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 sm:flex-initial rounded-2xl border border-[#bdc8f3]/40 bg-white px-3 py-2 text-xs font-semibold text-[#090f24] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="waiting_guarantor">Waiting for Guarantor</option>
              <option value="active">Active (Disbursed)</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="warning_30_days">Warning (30d)</option>
              <option value="defaulted_60_days">Defaulted (60d)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
              className="rounded-2xl border-[#bdc8f3]/40 bg-white text-[#090f24] shadow-sm hover:bg-[#dee3f9]/30"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Loan Grid List */}
        {isLoading ? (
          <LoadingState rows={5} />
        ) : loans.length === 0 ? (
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
            <EmptyState
              title="No loan applications found"
              description="Adjust your search query or filter settings."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loans.map((loan) => {
              const { variant, label } = statusToBadgeProps(loan.status);
              const applicant = loan.user || loan.userId || {};
              const loanIdStr = loan._id || loan.id || "";

              return (
                <Card
                  key={loanIdStr}
                  className="flex cursor-pointer flex-col justify-between rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm transition-all hover:border-[#1d2d6d]/40 hover:shadow-md active:scale-[0.99]"
                  onClick={() => openDetail(loanIdStr)}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#090f24]">
                          {applicant.fullName || applicant.name || "Unknown Member"}
                        </p>
                        <p className="font-mono text-[10px] text-gray-500">
                          Ref: {loan.loanNumber || `#${loanIdStr.slice(-8).toUpperCase()}`}
                        </p>
                      </div>
                      <Badge variant={variant}>{label}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#bdc8f3]/30 bg-[#dee3f9]/15 p-2 text-[11px]">
                      <div>
                        <span className="block text-[10px] font-medium text-gray-500">Principal</span>
                        <span className="font-extrabold text-[#090f24]">
                          {formatNaira(loan.principalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-medium text-gray-500">Tenure</span>
                        <span className="font-semibold text-[#090f24]">
                          {loan.durationMonths} {loan.durationMonths === 1 ? "Mo" : "Mos"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-medium text-gray-500">Applied</span>
                        <span className="font-semibold text-gray-600">
                          {formatDate(loan.createdAt, "MMM dd")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#dee3f9] pt-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="size-3 text-emerald-600" />
                      <span>
                        Rate: <strong className="text-[#090f24] font-bold">{loan.interestRate}%</strong>
                      </span>
                    </div>
                    <span className="flex items-center font-extrabold text-[#3b5bdb] hover:underline">
                      View Details <ChevronRight className="size-3.5 ml-0.5" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── LOAN DETAIL BOTTOM SHEET ─────────────────────── */}
        <BottomSheet
          isOpen={!!selectedLoanId}
          onClose={() => {
            setSelectedLoanId(null);
            setLoanDetail(null);
          }}
          title="Loan Application Review"
        >
          {detailLoading ? (
            <LoadingState rows={4} />
          ) : loanDetail ? (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 pb-4">
              
              {/* Header Status & Direct Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#bdc8f3]/40 bg-[#dee3f9]/20 p-3 shadow-sm">
                <Badge variant={statusToBadgeProps(loanDetail.status).variant}>
                  {statusToBadgeProps(loanDetail.status).label}
                </Badge>

                <div className="flex items-center gap-2">
                  {loanDetail.status === "pending_review" && (
                    <>
                      <Button
                        size="xs"
                        variant="success"
                        icon={CheckCircle}
                        disabled={isApproving}
                        onClick={() => setApproveTarget(loanDetail._id || loanDetail.id)}
                        className="rounded-xl font-bold"
                      >
                        {isApproving ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        icon={XCircle}
                        disabled={isRejecting}
                        onClick={() => {
                          setRejectTarget(loanDetail._id || loanDetail.id);
                          setRejectReason("");
                        }}
                        className="rounded-xl font-bold"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Loan Financial Core Summary */}
              <div className="space-y-2.5 rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-[#090f24]">
                  <FileText className="size-3.5 text-emerald-600" /> Financial Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-500 font-medium">Loan Reference</span>
                    <span className="font-mono font-bold text-[#090f24]">
                      {loanDetail.loanNumber || (loanDetail._id || loanDetail.id || "").slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 font-medium">Principal</span>
                    <span className="font-extrabold text-emerald-600">
                      {formatNaira(loanDetail.principalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 font-medium">Total Repayable</span>
                    <span className="font-extrabold text-[#090f24]">
                      {formatNaira(loanDetail.totalRepayable)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 font-medium">Interest Rate</span>
                    <span className="font-semibold text-[#090f24]">
                      {loanDetail.interestRate}% (₦{formatNaira(loanDetail.interestAmount)})
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 font-medium">Outstanding Balance</span>
                    <span className="font-bold text-rose-600">
                      {formatNaira(loanDetail.remainingBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 font-medium">Duration</span>
                    <span className="font-semibold text-[#090f24]">{loanDetail.durationMonths} Month(s)</span>
                  </div>
                </div>

                {loanDetail.purpose && (
                  <div className="border-t border-[#dee3f9] pt-2 text-xs">
                    <span className="block text-[10px] text-gray-500 font-medium">Stated Purpose</span>
                    <p className="font-medium text-[#090f24] mt-0.5">{loanDetail.purpose}</p>
                  </div>
                )}
              </div>

              {/* Member Profile */}
              {memberObj && (
                <div className="space-y-2 rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-[#090f24]">
                    <User className="size-3.5 text-emerald-600" /> Applicant Overview
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] text-gray-500 font-medium">Full Name</span>
                      <span className="font-bold text-[#090f24]">{memberObj.fullName || memberObj.name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-medium">Email</span>
                      <span className="font-medium text-[#090f24] truncate block">{memberObj.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-medium">Bank Account</span>
                      <span className="font-semibold text-[#090f24]">
                        {bankInfo.bankName || "N/A"} — {bankInfo.accountNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-medium">KYC Status</span>
                      <span className="font-bold text-[#090f24] capitalize">{memberObj.kycStatus || "Unverified"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Prerequisites Check */}
              {loanDetail.status === "pending_review" && (
                <div className="space-y-1 rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-[#090f24]">
                    <Shield className="size-3.5 text-emerald-600" /> Application Checks
                  </h4>
                  <PrereqItem
                    label="Bank Account Setup"
                    met={!!(bankInfo.accountNumber && bankInfo.bankCode)}
                  />
                  <PrereqItem
                    label="Bank Name Match"
                    met={!!bankInfo.accountName}
                  />
                  <PrereqItem
                    label="KYC Verification Passed"
                    met={memberObj.kycStatus === "approved"}
                  />
                </div>
              )}

              {/* Installments Breakdown */}
              {installments.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-[#090f24]">
                    <Calendar className="size-3.5 text-emerald-600" /> Repayment Timeline
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-[#dee3f9]/50">
                    {installments.map((inst, i) => (
                      <div
                        key={inst._id || i}
                        className="flex items-center justify-between pt-1.5 text-xs first:pt-0"
                      >
                        <div>
                          <span className="font-bold text-[#090f24]">
                            Instalment #{inst.installmentNumber || i + 1}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            Due: {formatDate(inst.dueDate, "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-[#090f24] block">
                            {formatNaira(inst.amountDue)}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-[#3b5bdb]">
                            {inst.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Note */}
              {loanDetail.status === "rejected" && loanDetail.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="size-3.5 text-rose-600" /> Rejection Description:
                  </span>
                  <p>{loanDetail.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-4">Failed to load detailed loan object.</p>
          )}
        </BottomSheet>

        {/* ── APPROVE CONFIRM DIALOG ───────────────────────── */}
        <ConfirmDialog
          isOpen={!!approveTarget}
          onClose={() => setApproveTarget(null)}
          title="Confirm Loan Application"
          description="Confirming changes this application from pending review to active. No payout will be sent."
          confirmLabel={isApproving ? "Confirming..." : "Confirm Loan"}
          onConfirm={confirmApprove}
          variant="success"
        />

        {/* ── REJECT DIALOG WITH REASON INPUT ──────────────── */}
        <BottomSheet
          isOpen={!!rejectTarget}
          onClose={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
          title="Reject Loan Application"
        >
          <div className="space-y-4 pt-1">
            <p className="text-xs text-gray-600">
              Provide a clear reason for rejecting this application. This note will be recorded in the system audit and shown to the applicant.
            </p>
            <textarea
              className="min-h-[100px] w-full rounded-2xl border border-[#bdc8f3]/50 bg-white p-3 text-xs text-[#090f24] placeholder:text-gray-400 focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
              placeholder="e.g. Insufficient savings balance to cover guarantor minimum ratio..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                size="sm"
                onClick={confirmReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="rounded-xl font-bold"
              >
                {isRejecting ? "Rejecting..." : "Reject Loan"}
              </Button>
            </div>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}