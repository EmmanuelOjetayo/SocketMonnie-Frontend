import { Skeleton } from "@/components/ui/Skeleton";

/** Generic list/card skeleton loader — pass `rows` to match expected content height. */
export function LoadingState({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}