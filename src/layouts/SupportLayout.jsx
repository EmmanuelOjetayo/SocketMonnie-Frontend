import { Outlet } from "react-router-dom";
import { LayoutDashboard, Ticket, UserCheck } from "lucide-react";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { ROUTES } from "@/constants/routes";

const NAV_ITEMS = [
  { to: ROUTES.SUPPORT, icon: LayoutDashboard, label: "Overview" },
  { to: ROUTES.SUPPORT, icon: Ticket, label: "Tickets" },
  { to: ROUTES.SUPPORT, icon: UserCheck, label: "Referrals" },
];

/** Customer Support desktop shell. */
export function SupportLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar items={NAV_ITEMS} brandLabel="Socket Moni Support" />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}