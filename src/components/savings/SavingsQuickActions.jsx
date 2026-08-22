import { Link } from "react-router-dom";
import { PiggyBank, ArrowUpRight, FileBarChart, Gift } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const ACTIONS = [
  { to: ROUTES.SAVINGS_DEPOSIT, icon: PiggyBank, label: "Save Money" },
  { to: ROUTES.SAVINGS_WITHDRAW, icon: ArrowUpRight, label: "Withdraw" },
  { to: ROUTES.REPORTS, icon: FileBarChart, label: "Reports" },
  { to: ROUTES.PROFILE, icon: Gift, label: "Refer" },
];

export function SavingsQuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ACTIONS.map(({ to, icon: Icon, label }) => (
        <Link key={label} to={to} className="flex flex-col items-center gap-2">
          <div className="flex size-13 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon className="size-5" />
          </div>
          <span className="text-center text-[11px] font-medium leading-tight text-text-secondary">{label}</span>
        </Link>
      ))}
    </div>
  );
}