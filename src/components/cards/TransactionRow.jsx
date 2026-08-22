import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatNaira, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

export function TransactionRow({ label, amount, direction, date }) {
  const isCredit = direction === "credit";
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isCredit ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500"
        )}
      >
        {isCredit ? <ArrowDownLeft className="size-4.5" /> : <ArrowUpRight className="size-4.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{formatDate(date)}</p>
      </div>
      <p className={cn("shrink-0 text-sm font-bold", isCredit ? "text-success-600" : "text-danger-500")}>
        {isCredit ? "+" : "-"}
        {formatNaira(Math.abs(amount))}
      </p>
    </div>
  );
}