import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";

/** Generic list/card skeleton loader - pass `rows` to match expected content height. */
export function LoadingState({ rows = 3, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}