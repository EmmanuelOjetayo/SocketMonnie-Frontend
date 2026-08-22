import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/navigation/BottomNav";

/** Full-screen member pages that shouldn't show the bottom tab bar (deposit, apply loan, loan details, notifications, withdraw, etc.). */
export function PlainShellLayout() {
  return (
    <div id="app-shell">
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}