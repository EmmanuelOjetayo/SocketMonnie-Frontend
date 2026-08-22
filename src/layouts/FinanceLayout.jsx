import { Outlet } from "react-router-dom";
import { LayoutDashboard, PiggyBank, Landmark } from "lucide-react";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { ROUTES } from "@/constants/routes";

const NAV_ITEMS = [
  { to: ROUTES.FINANCE, icon: LayoutDashboard, label: "Overview" },
  { to: ROUTES.FINANCE, icon: PiggyBank, label: "Savings" },
  { to: ROUTES.FINANCE, icon: Landmark, label: "Repayments" },
];

/** Finance Manager desktop shell. */
export function FinanceLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar items={NAV_ITEMS} brandLabel="Socket Moni Finance" />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}