import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Landmark, FileBarChart, ArrowDownToLine, Activity, Settings } from "lucide-react";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";

const ITEMS = [
  { to: ROUTES.ADMIN, icon: LayoutDashboard, label: "Home", end: true },
  { to: ROUTES.ADMIN_MEMBERS, icon: Users, label: "Members" },
  { to: ROUTES.ADMIN_LOANS, icon: Landmark, label: "Loans" },
  { to: ROUTES.WITHDRAWS, icon: ArrowDownToLine, label: "Withdraw" },
  { to: ROUTES.ADMIN_REPORTS, icon: FileBarChart, label: "Reports" },
  { to: ROUTES.ADMIN_AUDIT, icon: Activity, label: "Audit" },
  { to: ROUTES.ADMIN_SETTINGS, icon: Settings, label: "Settings" },
];

export function AdminBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(9,15,36,0.08)] backdrop-blur">
      <ul className="mx-auto flex max-w-xl items-center justify-between gap-1 overflow-x-auto">
        {ITEMS.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[52px] min-w-[52px] flex-col items-center justify-center rounded-2xl px-1 py-1.5 transition-all",
                  isActive ? "bg-[#3B52C6] text-white shadow-sm" : "text-gray-600 hover:bg-[#dee3f9]/40 hover:text-[#3B52C6]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={cn("mt-0.5 truncate text-[10px] font-semibold leading-tight", isActive ? "text-white" : "text-current")}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default AdminBottomNav;
