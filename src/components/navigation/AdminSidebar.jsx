import { NavLink } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Sidebar shell shared across Super Admin, Finance, and Support desktop layouts.
 */
export function AdminSidebar({
  items = [],
  brandLabel = "Socket Moni",
  user = null,
  onLogout,
}) {
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col text-white md:flex border-r border-brand-800/50 shadow-xl"
      style={{
        background:
          "linear-gradient(180deg, #090F47 0%, #1D2D6D 60%, #10194A 100%)",
      }}
    >
      {/* BRAND HEADER */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-lg font-black text-white shadow-md">
          S
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight leading-none text-white">
            {brandLabel}
          </h1>
          <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">
            Control Center
          </span>
        </div>
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 space-y-1.5 px-4 py-5 overflow-y-auto no-scrollbar">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin" || to === "/admin/dashboard"}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200",
                isActive
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  {Icon && (
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                  )}
                  <span>{label}</span>
                </div>

                {/* OPTIONAL BADGE (e.g. Pending Requests Count) */}
                {badge !== undefined && badge !== null && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                      isActive
                        ? "bg-white text-brand-700"
                        : "bg-teal-400/20 text-teal-300 border border-teal-400/30"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER USER PROFILE */}
      {user && (
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-xs text-white border border-white/20">
              {user.fullName?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user.fullName || "Admin User"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-teal-400 capitalize">
                <ShieldCheck className="size-3 shrink-0" />
                <span className="truncate">
                  {user.role?.replace("_", " ") || "Administrator"}
                </span>
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}