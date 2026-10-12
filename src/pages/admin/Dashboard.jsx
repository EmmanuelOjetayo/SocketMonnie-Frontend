import { useState } from "react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { getAdminReports } from "@/services/adminService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

export function AdminDashboard() {
  const { data, isLoading } = useAsync(() => getAdminReports({ type: "overview" }), []);
  const stats = data?.stats || {};

  if (isLoading) return <LoadingState rows={2} />;

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      <TopHeader variant="brand" />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6 pt-1">
        {/* Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)" }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[#dee3f9]">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold">Admin Command Center</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              System Overview
            </h1>
            <p className="mt-0.5 text-xs text-[#dee3f9]/80">
              Membership, active portfolio, and current monthly revenue performance at a glance.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-block rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold text-[#dee3f9]">
              Cooperative Health: Optimal
            </span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            icon={Users}
            label="Total Members"
            value={stats.totalMembers?.toLocaleString() || "0"}
            trend={`+${stats.newMembers || 0} this month`}
          />
          <StatCard
            icon={Landmark}
            label="Active Loans"
            value={stats.activeLoans?.toLocaleString() || "0"}
            trend={stats.loanOutstanding ? `${formatNaira(stats.loanOutstanding)} outstanding` : ""}
          />
          <StatCard
            icon={Percent}
            label="Default Rate"
            value={`${stats.defaultRate || 0}%`}
          />
          <StatCard
            icon={DollarSign}
            label="Revenue This Month"
            value={formatNaira(stats.revenue || 0)}
            trend={`+${stats.revenueGrowth || 0}% from last month`}
          />
        </div>
      </div>
    </div>
  );
}