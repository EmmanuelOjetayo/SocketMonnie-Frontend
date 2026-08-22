import { Link } from "react-router-dom";

export function SectionHeader({ title, actionLabel, actionTo }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-text-primary">{title}</h2>
      {actionTo && (
        <Link to={actionTo} className="text-sm font-semibold text-brand-600">
          {actionLabel ?? "See all"}
        </Link>
      )}
    </div>
  );
}