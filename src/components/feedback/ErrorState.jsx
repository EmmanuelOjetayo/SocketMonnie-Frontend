import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data right now.",
  onRetry,
  retryLabel = "Try again",
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
        <AlertTriangle className="size-5" />
      </div>
      <div>
        <p className="font-semibold text-[#090f24]">{title}</p>
        {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default ErrorState;
