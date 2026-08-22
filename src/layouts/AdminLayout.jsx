import { Outlet } from "react-router-dom";
import { AdminBottomNav } from "@/components/navigation/AdminBottomNav";

/** Super Admin app shell with fixed bottom navigation. */
export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <main className="pb-24">
        <Outlet />
      </main>
      <AdminBottomNav />
    </div>
  );
}