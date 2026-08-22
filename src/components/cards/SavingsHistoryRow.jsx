import { PiggyBank } from "lucide-react";
import { formatNaira, formatDate } from "@/utils/format";

export function SavingsHistoryRow({ entry }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <PiggyBank className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">Savings Deposit</p>
        <p className="text-xs text-text-muted">
          {formatDate(entry.date)} · {entry.method}
        </p>
      </div>
      <p className="text-sm font-bold text-success-600">+{formatNaira(entry.amount)}</p>
    </div>
  );
}