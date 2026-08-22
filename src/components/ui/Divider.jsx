import { cn } from "@/utils/cn";

export function Divider({ className, label }) {
  if (!label) return <hr className={cn("border-border", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <hr className="flex-1 border-border" />
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <hr className="flex-1 border-border" />
    </div>
  );
}