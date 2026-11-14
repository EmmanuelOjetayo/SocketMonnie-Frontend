import { useMemo, useState } from "react";
import { Activity, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getAuditLogs } from "@/services/adminService";
import { formatDate } from "@/utils/format";
import { AdminPageShell, AdminHero } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

function actionVariant(action) {
  const value = String(action || "").toLowerCase();
  if (/(approve|activate|disburse|complete|success)/.test(value)) return "success";
  if (/(reject|fail|error|suspend|default|recovery)/.test(value)) return "danger";
  if (/(deposit|repay|withdraw|payout|settings|update|kyc)/.test(value)) return "info";
  if (value.includes("loan") || value.includes("score")) return "brand";
  return "neutral";
}

function actorLabel(log) {
  if (log?.actorEmail) return log.actorEmail;
  if (typeof log?.actorId === "string") return log.actorId;
  if (log?.actorId && typeof log.actorId === "object") {
    return log.actorId.email || log.actorId.fullName || log.actorId._id || "Unknown actor";
  }
  return "Unknown actor";
}

function actorRole(log) {
  if (log?.actorRole) return log.actorRole;
  if (log?.actorId && typeof log.actorId === "object" && log.actorId.role) return log.actorId.role;
  return "";
}

export function AdminAuditTrail() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading, error, refetch } = useAsync(
    () => getAuditLogs({ page, limit, action: action || undefined, targetType: targetType || undefined }),
    [page, action, targetType]
  );

  const logs = data?.data || data?.logs || [];
  const meta = data?.meta || {};
  const totalPages = Math.max(1, Number(meta.pages || Math.ceil(Number(meta.totalLogs || logs.length) / limit) || 1));
  const totalLogs = Number(meta.totalLogs || logs.length || 0);

  const actions = useMemo(() => [
    { value: "", label: "All actions" },
    { value: "member_suspend", label: "Member suspended" },
    { value: "member_activate", label: "Member activated" },
    { value: "kyc_approve", label: "KYC approved" },
    { value: "kyc_reject", label: "KYC rejected" },
    { value: "loan_rejected", label: "Loan rejected" },
    { value: "withdrawal_approve", label: "Withdrawal approved" },
    { value: "withdrawal_reject", label: "Withdrawal rejected" },
    { value: "settings_update", label: "Settings updated" },
    { value: "system_settings_updated", label: "System settings updated" },
  ], []);

  const targetTypes = [
    { value: "", label: "All targets" },
    { value: "user", label: "User" },
    { value: "loan", label: "Loan" },
    { value: "savings", label: "Savings" },
    { value: "system", label: "System" },
    { value: "system_settings", label: "System settings" },
  ];

  return (
    <AdminPageShell>
      <AdminHero
        icon={Activity}
        eyebrow="Security & Compliance"
        title="Audit Trail"
        description="Review administrative and financial activity logs from live backend audit records."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch} className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
            Refresh
          </Button>
        }
      />

      <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-text-secondary">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-xl border border-[#bdc8f3]/50 bg-white px-3 text-sm font-medium text-[#090f24] focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/15"
            >
              {actions.map((a) => <option key={a.value || "all"} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-text-secondary">Target</label>
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-xl border border-[#bdc8f3]/50 bg-white px-3 text-sm font-medium text-[#090f24] focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/15"
            >
              {targetTypes.map((t) => <option key={t.value || "all"} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="text-xs font-semibold text-text-secondary">Showing page {page} of {totalPages} • {totalLogs.toLocaleString()} total log(s)</p>
            <p className="mt-1 text-xs text-text-muted">Audit entries are read from the backend log store. Filters apply server-side.</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          title="Could not load audit logs"
          description={error?.data?.message || error?.message || "Audit logs are unavailable right now."}
          onRetry={refetch}
        />
      ) : logs.length === 0 ? (
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
          <EmptyState title="No audit logs found" description="Try adjusting the filters or check back later." />
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const role = actorRole(log);
            const targetId = log.targetId ? String(log.targetId) : null;
            return (
              <Card key={log._id || `${log.action}-${log.createdAt}-${targetId || "x"}`} className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={actionVariant(log.action)}>{String(log.action || "unknown").replace(/_/g, " ")}</Badge>
                      <span className="text-sm font-bold capitalize text-[#090f24]">{String(log.targetType || "target").replace(/_/g, " ")}</span>
                      {targetId ? <span className="max-w-full truncate rounded-md bg-[#dee3f9]/30 px-2 py-0.5 font-mono text-[11px] text-text-secondary">ID: {targetId}</span> : null}
                    </div>
                    <p className="text-xs text-text-secondary">
                      Actor: <span className="font-semibold text-[#090f24] break-all">{actorLabel(log)}</span>
                      {role ? <span className="text-text-muted"> ({String(role).replace(/_/g, " ")})</span> : null}
                    </p>
                    {log.ipAddress ? <p className="font-mono text-[11px] text-text-muted">IP: {log.ipAddress}</p> : null}
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs font-semibold text-[#090f24]">{formatDate(log.createdAt, "MMM dd, yyyy h:mm a") || "—"}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && !error ? (
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl">
            Previous
          </Button>
          <span className="text-sm font-medium text-text-secondary">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl">
            Next
          </Button>
        </div>
      ) : null}
    </AdminPageShell>
  );
}

export default AdminAuditTrail;
