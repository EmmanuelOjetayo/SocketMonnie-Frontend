import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/utils/format";
import { TrendingUp } from "lucide-react";

export function SavingsSummaryCard({ totalSaved, monthlyContributed, monthlyTarget, streakMonths, isLoading }) {
  const progressPercent = monthlyTarget > 0 ? Math.min((monthlyContributed / monthlyTarget) * 100, 100) : 0;

  return (
    <Card lift className="bg-brand-600 text-white">
      <p className="text-xs font-medium text-brand-100">Total Savings Balance</p>
      {isLoading ? (
        <div className="mt-2 h-8 w-44 animate-pulse rounded bg-white/20" />
      ) : (
        <p className="mt-1 text-3xl font-black">{formatNaira(totalSaved || 0)}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-brand-500/40 pt-3 text-xs text-brand-100">
        <div>
          <p className="text-brand-200">This Month</p>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">
              {formatNaira(monthlyContributed || 0)} / {formatNaira(monthlyTarget || 0)}
            </p>
          </div>
          <div className="mt-1.5 w-24 h-1.5 bg-brand-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {streakMonths > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-brand-500/30 px-2.5 py-1 text-white">
            <TrendingUp className="size-3.5" />
            <span className="font-semibold">{streakMonths} Month Streak</span>
          </div>
        )}
      </div>
    </Card>
  );
}