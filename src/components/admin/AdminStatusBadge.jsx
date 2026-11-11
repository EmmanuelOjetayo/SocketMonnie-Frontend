import { Badge, statusToBadgeProps } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

/**
 * AdminStatusBadge — consistent status pill for admin tables/cards.
 * Maps backend status strings through the shared statusToBadgeProps map and
 * falls back to a neutral pill for unknown values (never invents a state).
 */
export function AdminStatusBadge({
  status,
  className,
  showDot = true,
}) {
  const { variant, label } = statusToBadgeProps(status);

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {showDot && (
        <span
          className={cn(
            "mr-1.5 size-1.5 rounded-full",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "danger" && "bg-rose-500",
            variant === "info" && "bg-info-500",
            variant === "neutral" && "bg-text-secondary",
            variant === "brand" && "bg-brand-500",
          )}
        />
      )}
      {label}
    </Badge>
  );
}

export default AdminStatusBadge;
