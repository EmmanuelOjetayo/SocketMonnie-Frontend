import { Inbox } from "lucide-react";
import { cn } from "@/utils/cn";

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-alt">
        <Icon className="size-6 text-text-muted" />
      </div>
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}