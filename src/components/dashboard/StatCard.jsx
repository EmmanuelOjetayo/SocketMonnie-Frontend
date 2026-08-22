import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export function StatCard({ icon: Icon, label, value, trend, className }) {
  return (
    <Card className={cn("flex items-center gap-3", className)}>
      {Icon && (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
          <Icon className="size-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-text-secondary">{label}</p>
        <p className="truncate text-lg font-bold text-text-primary">{value}</p>
        {trend && <p className="text-xs font-semibold text-success-600">{trend}</p>}
      </div>
    </Card>
  );
}