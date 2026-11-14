import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Eye, RefreshCw, ChevronLeft, ChevronRight, Landmark, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getAdminLoans, getLoanById, approveLoan, rejectLoan } from "@/services/adminService";
import { formatNaira, formatDate } from "@/utils/format";
import { AdminPageShell, AdminHero, AdminStatusBadge } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";

function getBorrower(loan) {
  return loan?.userId && typeof loan.userId === "object" ? loan.userId : loan?.user || {};
}

export function AdminLoans() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search.trim()), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const { data, isLoading, error, refetch } = useAsync(
    () => getAdminLoans({ status: statusFilter || undefined, search: debouncedSearch || undefined, page, limit }),
    [statusFilter, debouncedSearch, page]
  );

  const loans = data?.loans || data?.data?.loans || (Array.isArray(data?.data) ? data.data : []) || [];
  const pagination = data?.pagination || data?.data?.pagination || {};
  const totalCount = Number(pagination.total || loans.length || 0);
  const totalPages = Math.max(1, Number(pagination.totalPages || Math.ceil(totalCount / limit) || 1));

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState({ approve: false, reject: false });

  async function openLoan(loan) {
    setSelectedLoan(loan);
    setLoanDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await getLoanById(loan._id || loan.id);
      setLoanDetail(res?.loan || res?.data?.loan || res?.data || res);
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to load loan details.";
      setDetailError(msg);
      toast.error(msg);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeLoan() {
    setSelectedLoan(null);
    setLoanDetail(null);
    setDetailError(null);
  }

  async function handleApprove() {
    if (!approveTarget) return;
    setBusy((b) => ({ ...b, approve: true }));
    try {
      const res = await approveLoan(approveTarget);
      toast.success(res?.message || "Loan approved successfully.");
      setApproveTarget(null);
      await refetch();
      if (selectedLoan) await openLoan(selectedLoan);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to approve loan.");
    } finally {
      setBusy((b) => ({ ...b, approve: false }));
    }
  }

  async function handleReject() {
    const reason = rejectReason.trim();
    if (!rejectTarget) return;
    if (reason.length < 3) {
      toast.error("Rejection reason must be at least 3 characters.");
      return;
    }
    setBusy((b) => ({ ...b, reject: true }));
    try {
      const res = await rejectLoan(rejectTarget, reason);
      toast.success(res?.message || "Loan rejected successfully.");
      setRejectTarget(null);
      setRejectReason("");
      await refetch();
      if (selectedLoan) await openLoan(selectedLoan);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to reject loan.");
    } finally {
      setBusy((b) => ({ ...b, reject: false }));
    }
  }

  const loan = loanDetail || selectedLoan || {};
  const borrower = getBorrower(loan);
  const loanId = loan?._id || loan?.id;

  return (
    <AdminPageShell>
      <AdminHero
        icon={Landmark}
        eyebrow="Loan Operations"
        title="Loan Applications"
        description="Review loan requests, inspect borrower details, and perform approve/reject actions through live admin loan APIs."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch} className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">Refresh</Button>
        }
      />

      <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <Input icon={Search} placeholder="Search by loan number, borrower name/email/code..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl" />
          </div>
          <div className="md:col-span-5">
            <select
              className="h-12 w-full rounded-xl border border-[#bdc8f3]/40 bg-white px-3 text-sm font-semibold text-[#090f24] focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/15"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="waiting_guarantor">Waiting guarantor</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
              <option value="warning_30_days">Warning (30 days)</option>
              <option value="defaulted_60_days">Defaulted (60 days)</option>
              <option value="restricted_90_days">Restricted (90 days)</option>
              <option value="recovery_120_days">Recovery (120 days)</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState title="Could not load loans" description={error?.data?.message || error?.message || "Loan applications are unavailable right now."} onRetry={refetch} />
      ) : loans.length === 0 ? (
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
          <EmptyState title="No loan applications found" description="Try adjusting your search or status filter." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            {loans.map((item) => {
              const b = getBorrower(item);
              const id = item._id || item.id;
              return (
                <Card key={id} className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-[#090f24]">{b.fullName || "Unknown borrower"}</p>
                        <AdminStatusBadge status={item.status || "pending_review"} />
                      </div>
                      <p className="mt-0.5 text-xs text-text-secondary break-all">{b.email || "—"}{b.phone ? ` • ${b.phone}` : ""}</p>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Info label="Loan" value={item.loanNumber || `#${String(id).slice(-6)}`} mono />
                        <Info label="Principal" value={formatNaira(item.principalAmount || 0)} />
                        <Info label="Duration" value={`${item.durationMonths || item.duration || "—"} mo`} />
                        <Info label="Applied" value={formatDate(item.createdAt, "MMM dd, yyyy") || "—"} />
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <Button size="sm" variant="outline" icon={Eye} onClick={() => openLoan(item)} className="rounded-xl">Inspect</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#bdc8f3]/30 bg-white px-4 py-3 sm:flex-row">
            <p className="text-xs font-medium text-text-secondary">Page {page} of {totalPages} • {totalCount.toLocaleString()} loans</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl">Previous</Button>
              <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl">Next</Button>
            </div>
          </div>
        </>
      )}

      <BottomSheet isOpen={!!selectedLoan} onClose={closeLoan} title="Loan details" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {detailLoading ? (
          <LoadingState rows={5} />
        ) : detailError ? (
          <ErrorState title="Could not load loan details" description={detailError} onRetry={() => selectedLoan && openLoan(selectedLoan)} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{loan.loanNumber || `#${String(loanId || "").slice(-6)}`}</Badge>
              <AdminStatusBadge status={loan.status || "pending_review"} />
              {loan.payoutStatus ? <Badge variant={loan.payoutStatus === "completed" ? "success" : loan.payoutStatus === "failed" ? "danger" : "warning"}>Payout: {String(loan.payoutStatus).replace(/_/g, " ")}</Badge> : null}
            </div>

            <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#090f24]">Borrower</h4>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Name" value={borrower.fullName || "—"} />
                <Info label="Email" value={borrower.email || "—"} />
                <Info label="Phone" value={borrower.phone || "—"} />
                <Info label="KYC status" value={String(borrower.kycStatus || "—").replace(/_/g, " ")} />
              </div>
            </Card>

            <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#090f24]">Loan summary</h4>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="Principal" value={formatNaira(loan.principalAmount || 0)} />
                <Info label="Interest rate" value={loan.interestRate != null ? `${loan.interestRate}%` : "—"} />
                <Info label="Interest" value={formatNaira(loan.interestAmount || 0)} />
                <Info label="Total repayable" value={formatNaira(loan.totalRepayable || 0)} />
                <Info label="Remaining" value={formatNaira(loan.remainingBalance ?? loan.outstandingBalance ?? 0)} />
                <Info label="Duration" value={`${loan.durationMonths || loan.duration || "—"} month(s)`} />
                <Info label="Applied" value={formatDate(loan.createdAt, "MMM dd, yyyy h:mm a") || "—"} />
                <Info label="Purpose" value={loan.purpose || loan.loanPurpose || "—"} />
              </div>
              {loan.rejectionReason ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <p className="font-bold">Rejection reason</p>
                  <p className="mt-0.5">{loan.rejectionReason}</p>
                </div>
              ) : null}
              {loan.payoutFailureReason ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-bold">Payout issue</p>
                  <p className="mt-0.5">{loan.payoutFailureReason}</p>
                </div>
              ) : null}
            </Card>

            {Array.isArray(loan.installments || loan.repaymentSchedule) && (loan.installments || loan.repaymentSchedule).length ? (
              <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm">
                <h4 className="text-sm font-extrabold text-[#090f24]">Repayment schedule</h4>
                <div className="mt-3 space-y-2">
                  {(loan.installments || loan.repaymentSchedule).slice(0, 12).map((inst, idx) => (
                    <div key={inst._id || idx} className="flex flex-col gap-1 rounded-xl border border-[#dee3f9] bg-[#f8faff] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#090f24]">Installment {inst.installmentNumber || idx + 1}</p>
                        <p className="text-xs text-text-secondary">Due: {formatDate(inst.dueDate, "MMM dd, yyyy") || "—"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="text-sm font-extrabold text-[#090f24]">{formatNaira(inst.amount || inst.totalAmount || 0)}</span>
                        <AdminStatusBadge status={inst.status || "pending"} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {String(loan.status || "").toLowerCase() === "pending_review" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button fullWidth variant="success" icon={CheckCircle} onClick={() => setApproveTarget(loanId)} className="rounded-xl">Approve loan</Button>
                <Button fullWidth variant="danger" icon={XCircle} onClick={() => { setRejectTarget(loanId); setRejectReason(""); }} className="rounded-xl">Reject loan</Button>
              </div>
            ) : null}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve loan application"
        description="This sends an approval request to the backend. Only confirm if you have completed any required off-platform disbursement steps for this loan."
        confirmLabel={busy.approve ? "Approving..." : "Approve loan"}
        variant="success"
        isLoading={busy.approve}
      />

      <BottomSheet isOpen={!!rejectTarget} onClose={() => { if (!busy.reject) { setRejectTarget(null); setRejectReason(""); } }} title="Reject loan application">
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Provide a clear reason (minimum 3 characters). The applicant will be notified.</p>
          </div>
          <textarea
            className="min-h-[110px] w-full rounded-2xl border border-[#bdc8f3]/50 bg-white p-3 text-sm text-[#090f24] placeholder:text-gray-400 focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={busy.reject} className="rounded-xl">Cancel</Button>
            <Button variant="danger" fullWidth onClick={handleReject} disabled={busy.reject || rejectReason.trim().length < 3} className="rounded-xl font-bold">
              {busy.reject ? "Rejecting..." : "Reject loan"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AdminPageShell>
  );
}

function Info({ label, value, mono = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-semibold text-[#090f24] ${mono ? "font-mono text-xs" : ""}`}>{value ?? "—"}</p>
    </div>
  );
}

export default AdminLoans;
