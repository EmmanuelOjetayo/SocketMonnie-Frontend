import { cn } from "@/utils/cn";

/**
 * AdminStatCard — admin-grade analytical stat card.
 *
 * Mirrors the member-facing StatCard language (icon chip + label + value +
 * optional trend) but styled for dense admin dashboards and supporting an
 * optional `hint` for secondary context (e.g. sub-caption under the value).
 */
export function AdminStatCard({
  icon: Icon,
  label,
  value,
  trend,
  hint,
  tone = "brand",
  className,
}) {
  const tones = {
    brand: {
      iconWrap: "bg-brand-50 text-brand-600",
      value: "text-[#090F24]",
      trend: "text-brand-600",
    },
    success: {
      iconWrap: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-700",
      trend: "text-emerald-600",
    },
    warning: {
      iconWrap: "bg-amber-50 text-amber-600",
      value: "text-amber-700",
      trend: "text-amber-600",
    },
    danger: {
      iconWrap: "bg-rose-50 text-rose-600",
      value: "text-rose-700",
      trend: "text-rose-600",
    },
  };
  const t = tones[tone] || tones.brand;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            {label}
          </p>
          <p className={cn("mt-1.5 truncate text-xl font-extrabold tracking-tight sm:text-2xl", t.value)}>
            {value}
          </p>
          {trend && (
            <p className={cn("mt-1 text-[11px] font-bold", t.trend)}>{trend}</p>
          )}
          {hint && (
            <p className="mt-0.5 text-[10px] font-medium text-text-muted">{hint}</p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              t.iconWrap
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStatCard;
