import { useState } from "react";
import {
  Users,
  Landmark,
  TrendingUp,
  DollarSign,
  Search,
  Bell,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileBarChart,
  Settings,
  LayoutDashboard,
  Percent,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAsync } from "@/hooks/useAsync";
import { getAdminReports } from "@/services/adminService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

// ─── TOP HEADER COMPONENT ────────────────────────────────
export function AdminHeader({ onSearch }) {
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
            placeholder="Search system metrics, loans... (Press Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-[#bdc8f3]/30 bg-white/10 py-2 pl-9 pr-4 text-xs font-medium text-white placeholder:text-[#dee3f9]/60 backdrop-blur-md transition-all focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          System Online
        </div>

        <button className="relative rounded-full p-2 text-[#dee3f9] hover:bg-white/10 transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-400" />
        </button>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════

export function AdminDashboard() {
  const { data, isLoading } = useAsync(() => getAdminReports({ type: "overview" }), []);
  const stats = data?.stats || {};

  if (isLoading) return <LoadingState rows={2} />;

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* ── TOP HEADER ───────────────────────────────────── */}
      <AdminHeader />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6 pt-1">
        
        {/* Admin Overview Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: "linear-gradient(135deg, #1d2d6d 0%, #131e49 50%, #090f24 100%)",
          }}
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

        {/* ── STATS CARDS GRID ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-xs">
            <StatCard
              icon={Users}
              label="Total Members"
              value={stats.totalMembers?.toLocaleString() || "0"}
              trend={`+${stats.newMembers || 0} this month`}
            />
          </div>

          <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-xs">
            <StatCard
              icon={Landmark}
              label="Active Loans"
              value={stats.activeLoans?.toLocaleString() || "0"}
              trend={stats.loanOutstanding ? `${formatNaira(stats.loanOutstanding)} outstanding` : ""}
            />
          </div>

          <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-xs">
            <StatCard
              icon={Percent}
              label="Default Rate"
              value={`${stats.defaultRate || 0}%`}
            />
          </div>

          <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-xs">
            <StatCard
              icon={DollarSign}
              label="Revenue This Month"
              value={formatNaira(stats.revenue || 0)}
              trend={`+${stats.revenueGrowth || 0}% from last month`}
            />
          </div>
        </div>

      </div>
    </div>
  );
}