import { useAsync } from "@/hooks/useAsync";
import { getAdminReports } from "@/services/adminService";
import { formatNaira } from "@/utils/format";
import { Users, Landmark, Percent, DollarSign, LayoutDashboard } from "lucide-react";
import { AdminPageShell, AdminHero, AdminStatCard } from "@/components/admin";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function AdminDashboard() {
  const { data, isLoading, error, refetch } = useAsync(() => getAdminReports({ type: "overview" }), []);
  const stats = data?.stats || data?.data?.stats || {};

  return (
    <AdminPageShell>
      <AdminHero
        icon={LayoutDashboard}
        eyebrow="Admin Control Center"
        title="System Overview"
        description="Monitor membership, loan portfolio, and platform revenue from live administrative reports."
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState
          title="Could not load dashboard overview"
          description={error?.data?.message || error?.message || "The overview report is unavailable right now."}
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            icon={Users}
            label="Total Members"
            value={Number(stats.totalMembers || 0).toLocaleString()}
            trend={stats.newMembers ? `+${Number(stats.newMembers).toLocaleString()} this month` : "Member base"}
            tone="brand"
          />
          <AdminStatCard
            icon={Landmark}
            label="Active Loans"
            value={Number(stats.activeLoans || 0).toLocaleString()}
            trend={stats.loanOutstanding ? `${formatNaira(stats.loanOutstanding)} outstanding` : "Current active portfolio"}
            tone="brand"
          />
          <AdminStatCard
            icon={Percent}
            label="Default Rate"
            value={`${Number(stats.defaultRate || 0)}%`}
            trend="Based on available loan portfolio data"
            tone={Number(stats.defaultRate || 0) > 0 ? "warning" : "success"}
          />
          <AdminStatCard
            icon={DollarSign}
            label="Revenue This Month"
            value={formatNaira(stats.revenue || 0)}
            trend={stats.revenueGrowth != null ? `${Number(stats.revenueGrowth)}% vs last month` : "Revenue snapshot"}
            tone="success"
          />
        </div>
      )}
    </AdminPageShell>
  );
}

export default AdminDashboard;
