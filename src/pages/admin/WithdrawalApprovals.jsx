import { useState } from "react";
import { TopHeader } from "@/components/navigation/TopHeader";
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
import { ROUTES } from "@/constants/routes";

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
    <div className="p-6 max-w-7xl mx-auto">
      <TopHeader />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: "linear-gradient(135deg, #5B76E1 0%, #131e49 50%, #090f24 100%)" }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[#dee3f9]">
              <Landmark className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold">Withdrawal Approvals</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Withdrawal Approvals
            </h1>
            <p className="mt-0.5 text-xs text-[#dee3f9]/80">
              Review pending withdrawal requests and approve or reject payouts.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-block rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold text-[#dee3f9]">
              {totalPages || 1} Page(s)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#090f24]">Withdrawal Approvals</h1>
            <p className="text-sm text-gray-500">
              Pending withdrawal requests awaiting administrator approval.
            </p>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        </div>

        {/* Withdrawals List */}
        <div className="mt-6 space-y-4">
          {withdrawals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-text-muted">No pending withdrawal requests.</p>
            </Card>
          ) : (
            withdrawals.map((w) => (
              <Card key={w._id} className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#090f24]">
                        {w.userId?.fullName || "Unknown Member"}
                      </p>
                      <Badge variant="warning">Pending Approval</Badge>
                    </div>
                    {w.userId?.phone && (
                      <p className="text-xs text-gray-500 mt-0.5">{w.userId.phone}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">Amount</span>
                        <p className="font-semibold">{formatNaira(w.amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Fee</span>
                        <p>{formatNaira(w.fee || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Total</span>
                        <p className="font-semibold">{formatNaira((w.amount || 0) + (w.fee || 0))}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Bank</span>
                        <p>{w.bankDetails?.bankName || "—"} | Acct: {w.bankDetails?.accountNumber || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-gray-500 text-xs">
                      <span>Requested: {formatDate(w.createdAt, "MMM dd, yyyy h:mm a")}</span>
                      {w.reference && <span>Ref: {w.reference}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleApproveClick(w._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRejectClick(w._id)}
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
            <span className="text-sm text-gray-500">
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

        {/* Approve Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!approvingId}
          onClose={() => setApprovingId(null)}
          title="Approve Withdrawal"
          description="Are you sure you want to approve this withdrawal?"
          confirmLabel="Approve & Pay Out"
          variant="success"
          isLoading={actionLoading}
        />

        {/* Reject Bottom Sheet */}
        <BottomSheet
          isOpen={!!rejectTarget}
          onClose={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
          title="Reject Withdrawal"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Provide a reason for rejecting this withdrawal request. The member will be notified.
            </p>
            <textarea
              className="w-full min-h-[100px] rounded-2xl border border-[#bdc8f3]/50 bg-white p-3 text-sm text-[#090f24] placeholder:text-gray-400 focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
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
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="rounded-xl font-bold"
              >
                Reject Withdrawal
              </Button>
            </div>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}