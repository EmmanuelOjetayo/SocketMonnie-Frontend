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

  const scorePayload = breakdownData?.data || breakdownData || {};
  const breakdown = scorePayload.components || breakdownData?.breakdown || [];
  const history = historyData?.data || historyData || [];
  const percentile = scorePayload.percentile || "—";
  const change = scorePayload.change || 0;

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
                const Icon = ICON_MAP[item.name] || Award;
                const maximum = Number(item.maximum ?? item.weight ?? 0);
                const earned = Number(item.score ?? item.contribution ?? 0);
                return (
                  <Card key={item.code || item.name} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-text-primary">{item.name}</span>
                          <span className="font-bold text-brand-600">{earned.toFixed(2)} / {maximum}</span>
                        </div>
                        <p className="text-xs text-text-muted">{item.rawScore}% | {item.status || "configured"}</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-surface-alt overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, item.rawScore || 0))}%` }}
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
                {scorePayload.tip || "Your score is calculated from the active component configuration."}
              </p>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-sm font-bold text-text-primary mb-3">Score History</h2>
          {loadingHistory ? (
            <LoadingState rows={2} />
          ) : history.length === 0 ? (
            <EmptyState title="No score history yet" />
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <Card key={entry._id || `${entry.calculatedAt}-${entry.configurationVersion}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{Number(entry.overallScore || 0).toFixed(2)}/100</p>
                      <p className="text-xs text-text-muted">
                        {entry.calculatedAt ? new Date(entry.calculatedAt).toLocaleDateString() : "Historical calculation"}
                        {entry.configurationVersion ? ` | Configuration v${entry.configurationVersion}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-brand-600">{entry.trigger || "system update"}</span>
                  </div>
                  {entry.components?.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {entry.components.map((component) => (
                        <div key={component.code} className="rounded-lg bg-surface-alt px-2 py-1.5">
                          <p className="truncate text-[11px] text-text-muted">{component.name}</p>
                          <p className="text-xs font-semibold text-text-primary">
                            {component.rawScore}/100 | +{Number(component.contribution || 0).toFixed(2)} | {component.status || "configured"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}