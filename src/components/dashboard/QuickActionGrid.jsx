import { Link } from "react-router-dom";

/** Icon grid of shortcut actions, e.g. Deposit / Apply Loan / Invite / Statement. */
export function QuickActionGrid({ actions }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, icon: Icon, label }) => (
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