import { NavLink } from "react-router-dom";
import { Home, PiggyBank, HandCoins, ClipboardList, User } from "lucide-react";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";

const ITEMS = [
  { to: ROUTES.DASHBOARD, icon: Home, label: "Home" },
  { to: ROUTES.SAVINGS, icon: PiggyBank, label: "Savings" },
  { to: ROUTES.LOANS, icon: HandCoins, label: "Loan" },
  { to: ROUTES.REPORTS, icon: ClipboardList, label: "Report" },
  { to: ROUTES.PROFILE, icon: User, label: "Profile" },
];

/** Fixed bottom tab bar for the member app matching the floating active pill design */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-gray-100 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <ul className="flex items-center justify-around">
        {ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex flex-1 items-center justify-center">
            <NavLink
              to={to}
              end={to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200 ease-in-out",
                  isActive
                    ? "size-16 rounded-full bg-[#3B52C6] text-white shadow-md -translate-y-1"
                    : "gap-1 text-gray-700 hover:text-[#3B52C6]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "transition-transform duration-200",
                      isActive ? "size-5" : "size-5"
                    )}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  <span
                    className={cn(
                      "font-medium leading-tight",
                      isActive
                        ? "text-[11px] font-semibold text-white"
                        : "text-[11px] text-gray-800"
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}