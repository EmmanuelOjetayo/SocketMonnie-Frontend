import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/navigation/BottomNav";

/** Main member-app shell: content area + fixed bottom tab bar. */
export function UserLayout() {
  return (
    <div id="app-shell">
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}