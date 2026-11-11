import { cn } from "@/utils/cn";

/**
 * AdminPageHeader — consistent page header for every admin screen.
 *
 * Gives the admin section a single, predictable heading pattern:
 *   eyebrow (optional small overline) → title → subtitle → actions.
 * Admin screens previously ad-hoc'd their headers inline; this keeps the
 * hierarchy identical while letting pages pass their own actions.
 */
export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3B52C6]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-extrabold tracking-tight text-[#090F24] sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-text-secondary">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export default AdminPageHeader;
