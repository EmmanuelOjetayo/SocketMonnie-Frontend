import { useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, ChevronLeft, ChevronRight, ArrowDownToLine, Landmark, AlertTriangle } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from "@/services/adminService";
import { formatNaira, formatDate } from "@/utils/format";
import { AdminPageShell, AdminHero, AdminStatusBadge } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function WithdrawalApprovals() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAsync(() => getPendingWithdrawals({ page, limit: 10 }), [page]);
  const withdrawals = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = Number(pagination.totalPages || 1);

  const [approvingId, setApprovingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const confirmApprove = async () => {
    if (!approvingId) return;
    setActionLoading(true);
    try {
      await approveWithdrawal(approvingId);
      toast.success("Withdrawal approved successfully.");
      setApprovingId(null);
      await refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to approve withdrawal.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    const reason = rejectReason.trim();
    if (!rejectTarget) return;
    if (reason.length < 3) {
      toast.error("Rejection reason must be at least 3 characters.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectWithdrawal(rejectTarget, reason);
      toast.success("Withdrawal rejected.");
      setRejectTarget(null);
      setRejectReason("");
      await refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to reject withdrawal.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminPageShell>
      <AdminHero
        icon={ArrowDownToLine}
        eyebrow="Payout Operations"
        title="Withdrawal Approvals"
        description="Review pending member withdrawal requests and approve or reject payouts with audit-safe actions."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch} className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState
          title="Could not load pending withdrawals"
          description={error?.data?.message || error?.message || "The withdrawal queue is unavailable right now."}
          onRetry={refetch}
        />
      ) : withdrawals.length === 0 ? (
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
          <EmptyState title="No pending withdrawals" description="There are no withdrawal requests awaiting approval." />
        </Card>
      ) : (
        <div className="space-y-3.5">
          {withdrawals.map((w) => {
            const amount = Number(w.amount || 0);
            const fee = Number(w.fee || 0);
            const total = amount + fee;
            const memberName = w.userId?.fullName || w.user?.fullName || "Unknown member";
            const memberPhone = w.userId?.phone || w.user?.phone;
            const bankName = w.bankDetails?.bankName || "—";
            const accountNumber = w.bankDetails?.accountNumber || "—";
            const accountName = w.bankDetails?.accountName;

            return (
              <Card key={w._id || w.id} className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[#090f24] sm:text-base">{memberName}</h3>
                      <AdminStatusBadge status={w.status || "pending_approval"} />
                    </div>
                    {memberPhone ? <p className="text-xs font-medium text-text-secondary">{memberPhone}</p> : null}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Metric label="Amount" value={formatNaira(amount)} />
                      <Metric label="Fee" value={formatNaira(fee)} />
                      <Metric label="Total Debit" value={formatNaira(total)} strong />
                      <Metric label="Requested" value={formatDate(w.createdAt, "MMM dd, yyyy h:mm a") || "—"} />
                    </div>

                    <div className="rounded-xl border border-[#dee3f9] bg-[#f8faff] p-3">
                      <div className="flex items-start gap-2">
                        <Landmark className="mt-0.5 size-4 shrink-0 text-[#3B52C6]" />
                        <div className="min-w-0 text-sm">
                          <p className="font-semibold text-[#090f24]">{bankName}</p>
                          <p className="text-xs text-text-secondary break-all">
                            {accountNumber}{accountName ? ` • ${accountName}` : ""}
                          </p>
                          {w.reference ? <p className="mt-1 text-[11px] font-mono text-text-muted">Ref: {w.reference}</p> : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[180px] lg:pt-1">
                    <Button variant="success" size="sm" onClick={() => setApprovingId(w._id || w.id)} className="rounded-xl font-bold">
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRejectTarget(w._id || w.id);
                        setRejectReason("");
                      }}
                      className="rounded-xl font-bold"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && !error && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl">
            Previous
          </Button>
          <span className="text-sm font-medium text-text-secondary">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl">
            Next
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={!!approvingId}
        onClose={() => setApprovingId(null)}
        onConfirm={confirmApprove}
        title="Approve withdrawal"
        description="Confirm approval for this withdrawal request. This action follows backend payout and ledger rules."
        confirmLabel={actionLoading ? "Approving..." : "Approve withdrawal"}
        variant="success"
        isLoading={actionLoading}
      />

      <BottomSheet
        isOpen={!!rejectTarget}
        onClose={() => {
          if (actionLoading) return;
          setRejectTarget(null);
          setRejectReason("");
        }}
        title="Reject withdrawal"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>Provide a clear reason (minimum 3 characters). The member will be notified.</p>
          </div>
          <textarea
            className="min-h-[110px] w-full rounded-2xl border border-[#bdc8f3]/50 bg-white p-3 text-sm text-[#090f24] placeholder:text-gray-400 focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={actionLoading} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={confirmReject} disabled={actionLoading || rejectReason.trim().length < 3} className="rounded-xl font-bold">
              {actionLoading ? "Rejecting..." : "Reject withdrawal"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AdminPageShell>
  );
}

function Metric({ label, value, strong = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={strong ? "mt-0.5 text-sm font-extrabold text-[#090f24]" : "mt-0.5 text-sm font-semibold text-[#090f24] break-words"}>{value}</p>
    </div>
  );
}

export default WithdrawalApprovals;
