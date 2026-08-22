import { useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { useAsync } from "@/hooks/useAsync";
import { getPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from "@/services/adminService";
import { formatNaira, formatDate } from "@/utils/format";

export function WithdrawalApprovals() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAsync(() => getPendingWithdrawals({ page, limit: 10 }), [page]);
  const withdrawals = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;

  const [approvingId, setApprovingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleApproveClick = (withdrawalId) => setApprovingId(withdrawalId);

  const confirmApprove = async () => {
    if (!approvingId) return;
    setActionLoading(true);
    try {
      await approveWithdrawal(approvingId);
      toast.success("Withdrawal approved and payout initiated.");
      setApprovingId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (withdrawalId) => {
    setRejectTarget(withdrawalId);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectWithdrawal(rejectTarget, rejectReason.trim());
      toast.success("Withdrawal rejected.");
      setRejectTarget(null);
      setRejectReason("");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reject.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Withdrawal Approvals</h1>
          <p className="text-sm text-text-secondary">
          
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch}>
          Refresh
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {withdrawals.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-muted">No pending withdrawal requests.</p>
          </Card>
        ) : (
          withdrawals.map((w) => (
            <Card key={w._id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {w.userId?.fullName || "Unknown Member"}
                    </p>
                    <Badge variant="warning">Pending Approval</Badge>
                  </div>
                  {w.userId?.phone && (
                    <p className="text-xs text-text-muted mt-0.5">{w.userId.phone}</p>
                  )}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-text-muted text-xs">Amount</span>
                      <p className="font-semibold">{formatNaira(w.amount)}</p>
                    </div>
                    <div>
                      <span className="text-text-muted text-xs">Fee</span>
                      <p>{formatNaira(w.fee || 0)}</p>
                    </div>
                    <div>
                      <span className="text-text-muted text-xs">Total</span>
                      <p className="font-semibold">{formatNaira((w.amount || 0) + (w.fee || 0))}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-text-muted">
                    <span>Bank: {w.bankDetails?.bankName || "—"} | Acct: {w.bankDetails?.accountNumber || "—"}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-text-muted">
                    <span>Requested: {formatDate(w.createdAt, "MMM dd, yyyy h:mm a")}</span>
                    {w.reference && <span>Ref: {w.reference}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApproveClick(w._id)}
                    isLoading={actionLoading && approvingId === w._id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRejectClick(w._id)}
                    isLoading={actionLoading && rejectTarget === w._id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {(totalPages || 0) > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            iconPosition="right"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!approvingId}
        onClose={() => setApprovingId(null)}
        onConfirm={confirmApprove}
        title="Approve Withdrawal"
        description="Are you sure you want to approve this withdrawal?"
        confirmLabel="Approve & Pay Out"
        variant="success"
        isLoading={actionLoading}
      />

      <BottomSheet
        isOpen={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        title="Reject Withdrawal"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Provide a reason for rejecting this withdrawal request. The member will be notified.
          </p>
          <textarea
            className="w-full min-h-[100px] rounded-control border border-border bg-card p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={confirmReject}
              isLoading={actionLoading}
              disabled={!rejectReason.trim()}
            >
              Reject Withdrawal
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}