import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getScoreBreakdown, getScoreHistory } from "@/services/scoreService";
import { getScoreRating, formatNaira } from "@/utils/format";
import { Award, TrendingUp, ShieldCheck, Users } from "lucide-react";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";

const ICON_MAP = {
  "Savings Discipline": TrendingUp,
  "Loan Repayment": ShieldCheck,
  "Community Trust": Users,
};

export function SocketScore() {
  const { user } = useAuth();
  const score = user?.socketScore || 0;
  const { label, tier } = getScoreRating(score);

  const { data: breakdownData, isLoading: loadingBreakdown } = useAsync(getScoreBreakdown, []);
  const { data: historyData, isLoading: loadingHistory } = useAsync(() => getScoreHistory({ months: 6 }), []);

  const breakdown = breakdownData?.breakdown || breakdownData?.data || [];
  const percentile = breakdownData?.percentile || "Top 20%";
  const change = breakdownData?.change || 0;

  return (
    <div>
      <TopHeader title="Socket Score" showBack />
      <div className="px-5 pb-8 space-y-5">
        <Card className="p-6 text-center">
          <p className="text-sm font-semibold text-text-primary">Your Socket Score</p>
          <p className="text-xs text-text-muted mt-1">
            Your score reflects your financial discipline, trust and participation in the cooperative.
          </p>
          <div className="flex justify-center mt-4">
            <ProgressRing score={score} size={140} strokeWidth={14} />
          </div>
          <p className="mt-2 text-lg font-bold text-brand-600">{label}</p>
          <p className="text-xs text-text-muted">Percentile: {percentile}</p>
          <p className={`text-xs mt-1 ${change >= 0 ? "text-success-600" : "text-danger-600"}`}>
            {change >= 0 ? "+" : ""}{change} points from last month
          </p>
        </Card>

        <div>
          <h2 className="text-sm font-bold text-text-primary mb-3">Score Breakdown</h2>
          {loadingBreakdown ? (
            <LoadingState rows={3} />
          ) : breakdown.length === 0 ? (
            <EmptyState title="No breakdown data" />
          ) : (
            <div className="space-y-3">
              {breakdown.map((item) => {
                const Icon = ICON_MAP[item.label] || Award;
                return (
                  <Card key={item.label} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-text-primary">{item.label}</span>
                          <span className="font-bold text-brand-600">{item.value}%</span>
                        </div>
                        <p className="text-xs text-text-muted">{item.description}</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-surface-alt overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="p-4 bg-brand-50 border-brand-100">
          <div className="flex items-start gap-3">
            <Award className="size-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-800">Insights & Tips</p>
              <p className="text-xs text-brand-700 mt-1">
                {breakdownData?.tip || "Great job! You are on the right track. To reach an A+ Elite grade, try to maintain consistent savings and repay loans on or before due date."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}