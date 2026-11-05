import { useState } from "react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { getAuditLogs } from "@/services/adminService";
import { formatDate } from "@/utils/format";

function actionVariant(action) {
  const value = String(action || "").toLowerCase();
  if (value.includes("approve") || value.includes("disburse")) return "success";
  if (value.includes("reject") || value.includes("fail") || value.includes("error")) return "danger";
  if (value.includes("deposit") || value.includes("repay") || value.includes("withdraw")) return "info";
  if (value.includes("loan")) return "brand";
  return "neutral";
}

export function AdminAuditTrail() {
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { data, isLoading, refetch } = useAsync(
    () =>
      getAuditLogs({
        page,
        limit,
        action: action || undefined,
        targetType: targetType || undefined,
      }),
    [page, action, targetType, limit]
  );

  const logs =
    data?.data?.data || data?.data?.logs || data?.data || data?.logs || [];
  const meta = data?.meta || data?.data?.meta || {};

  const actions = [
    { value: "", label: "All actions" },
    { value: "loan_approve", label: "Loan approved" },
    { value: "withdrawal_approve", label: "Withdrawal approved" },
    { value: "withdrawal_reject", label: "Withdrawal rejected" },
    { value: "deposit", label: "Deposit settled" },
    { value: "monthly_minutes_paid", label: "Minutes paid" },
  ];

  const targetTypes = [
    { value: "", label: "All targets" },
    { value: "loan", label: "Loan" },
    { value: "savings", label: "Savings" },
    { value: "user", label: "User" },
    { value: "guarantor", label: "Guarantor" },
    { value: "minutes", label: "Minutes" },
  ];

  return (
    <div className="mx-auto mt-4 w-full max-w-7xl p-6 space-y-6">
      <TopHeader variant="brand" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#090f24]">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable financial and administrative action log.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500">Action</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {actions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500">Target</label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {targetTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500">Page</label>
            <div className="mt-1 flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <span className="text-sm text-gray-600">{page}</span>
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs found" description="Adjust the filters and try again." />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log._id}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                    <span className="text-sm font-semibold text-[#090f24]">{log.targetType}</span>
                    {log.targetId && (
                      <span className="text-xs font-mono text-gray-500">ID: {log.targetId}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Actor:{" "}
                    <span className="font-semibold text-gray-700">
                      {log.actorEmail || log.actorId || "unknown"}
                      {log.actorRole ? ` (${log.actorRole})` : ""}
                    </span>
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{formatDate(log.createdAt)}</p>
                  {log.ipAddress && <p className="font-mono text-[10px]">IP: {log.ipAddress}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {page} of {Math.max(1, Math.ceil(Number(meta.totalLogs || logs.length) / limit))}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-xs font-bold text-[#3B52C6]">
              Previous
            </button>
            <button type="button" onClick={() => setPage((p) => p + 1)} className="text-xs font-bold text-[#3B52C6]">
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
