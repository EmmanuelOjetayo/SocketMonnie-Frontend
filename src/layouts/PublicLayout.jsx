import { Outlet } from "react-router-dom";

/** Wraps unauthenticated marketing/get-started screens. */
export function PublicLayout() {
  return (
    <div id="app-shell">
      <Outlet />
    </div>
  );
}