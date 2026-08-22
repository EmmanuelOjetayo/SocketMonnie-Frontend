import { Bell, PiggyBank, Landmark, Star } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/format";

const ICONS = { savings: PiggyBank, loan: Landmark, rating: Star, default: Bell };

export function NotificationCard({ notification }) {
  const Icon = ICONS[notification.type] || ICONS.default;
  return (
    <div className={cn("flex gap-3 rounded-card p-4", notification.read ? "bg-card" : "bg-brand-50/60")}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{notification.title}</p>
          {!notification.read && <span className="size-2 shrink-0 rounded-full bg-brand-600" />}
        </div>
        <p className="mt-0.5 text-sm text-text-secondary">{notification.message}</p>
        <p className="mt-1 text-xs text-text-muted">{formatRelative(notification.date)}</p>
      </div>
    </div>
  );
}