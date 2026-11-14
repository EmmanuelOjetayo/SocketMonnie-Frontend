import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Landmark,
  FileBarChart,
  ArrowDownToLine,
  Award,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { AdminBottomNav } from "@/components/navigation/AdminBottomNav";

const NAV_ITEMS = [
  { to: ROUTES.ADMIN, label: "Overview", icon: LayoutDashboard, end: true },
  { to: ROUTES.ADMIN_MEMBERS, label: "Members", icon: Users },
  { to: ROUTES.ADMIN_LOANS, label: "Loans", icon: Landmark },
  { to: ROUTES.WITHDRAWS, label: "Withdrawals", icon: ArrowDownToLine },
  { to: ROUTES.ADMIN_REPORTS, label: "Reports", icon: FileBarChart },
  { to: ROUTES.ADMIN_SCORE_CONFIG, label: "SocketScore", icon: Award },
  { to: ROUTES.ADMIN_AUDIT, label: "Audit Trail", icon: Activity },
  { to: ROUTES.ADMIN_SETTINGS, label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#090f24]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/10 md:flex" style={{ background: "linear-gradient(180deg, #090F47 0%, #1D2D6D 60%, #10194A 100%)" }}>
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-lg font-black text-white shadow-md">S</div>
              <div>
                <p className="text-sm font-extrabold tracking-tight text-white">Socket Monie</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300">Admin Control</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 min-w-0">
              <p className="truncate text-sm font-bold text-white">{user?.fullName || "Administrator"}</p>
              <p className="truncate text-xs text-slate-300">{user?.email || "Super Admin"}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="pb-24 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      <div className="md:hidden">
        <AdminBottomNav />
      </div>
    </div>
  );
}

export default AdminLayout;
