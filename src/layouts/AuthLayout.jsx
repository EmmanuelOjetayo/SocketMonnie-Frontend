import { Outlet } from "react-router-dom";

/** Wraps login / register / forgot-password / verify-otp / reset-password screens. */
export function AuthLayout() {
  return (
    <div id="app-shell">
      <div className="px-6 pb-10 pt-12">
        <Outlet />
      </div>
    </div>
  );
}