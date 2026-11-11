import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  TrendingUp,
  PiggyBank,
  ShieldCheck,
  Landmark,
  UserCheck,
  Users,
  Info,
  Target,
  RefreshCw,
  CalendarDays,
  CircleHelp,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAsync } from "@/hooks/useAsync";
import {
  getScoreSummary,
  getScoreBreakdown,
  getMonthlyHistory,
  getScoreExplanation,
  finalizeMonthlyScore,
} from "@/services/scoreService";
import { getScoreRating } from "@/utils/format";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ICON_MAP = {
  savings_consistency: TrendingUp,
  savings_growth: PiggyBank,
  loan_repayment: ShieldCheck,
  withdrawal_behaviour: Landmark,
  profile_completion: UserCheck,
  community_trust: Users,
  "Savings Consistency": TrendingUp,
  "Savings Growth": PiggyBank,
  "Loan Repayment": ShieldCheck,
  "Withdrawal Behaviour": Landmark,
  "Profile Completion": UserCheck,
  "Community Trust": Users,
};

const HELP_MAP = {
  savings_consistency: "Score improves when you consistently fulfil your savings commitments. Access matters: verified deposits count; failed gateway requests never count against you.",
  savings_growth: "Your score improves when your savings balance grows. A steady 10% monthly growth earns full marks. Loan money is never counted as growth.",
  loan_repayment: "On-time repayments earn full marks. If you have no loan due in a month, this part is skipped (not scored as zero). Repay on time.",
  withdrawal_behaviour: "Do not punish legitimate withdrawals. Withdrawing up to 20% of your opening balance earns full marks.",
  profile_completion: "Complete and verify your personal information, verified bank details and approved KYC documents.",
  community_trust: "Verified referrals and verified guarantor participation build trust. Fake or duplicate referrals earn nothing.",
};

const TIPS = [
  "Save consistently — fulfil your savings commitment every month.",
  "Repay loans on time to keep your repayment score high.",
  "Follow cooperative withdrawal rules and keep a healthy balance.",
  "Complete and verify your profile and KYC documents.",
  "Participate honestly in the cooperative — verified referrals and legitimate guarantor roles build trust.",
  "Do not borrow unnecessarily just to improve your score, and do not avoid legitimate withdrawals out of fear.",
];

function periodLabel(p) {
  if (!p?.year || !p?.month) return "—";
  return `${MONTHS[p.month - 1] || p.month} ${p.year}`;
}

/** Ease-out count-up used for the headline score. */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const numeric = Number(target || 0);
    let raf;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(numeric * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function TrendChart({ points }) {
  const data = points || [];
  if (!data.length) return null;

  const max = Math.max(100, ...data.map((d) => d.cumulativeScore || 0));
  const w = 320;
  const h = 120;
  const padX = 14;
  const padY = 14;
  const x = (i) =>
    padX +
    (data.length === 1
      ? (w - padX * 2) / 2
      : (i / (data.length - 1)) * (w - padX * 2));
  const y = (v) =>
    h - padY - ((Number(v || 0)) / (max || 1)) * (h - padY * 2);

  const line = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.cumulativeScore).toFixed(1)}`
    )
    .join(" ");

  const area = `${line} L${x(data.length - 1).toFixed(1)},${h - padY} L${x(
    0
  ).toFixed(1)},${h - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-32 w-full"
      role="img"
      aria-label="Cumulative SocketScore trend"
    >
      <defs>
        <linearGradient id="socketScoreTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B52C6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3B52C6" stopOpacity="0" />
        </linearGradient>
      </defs>

      <line
        x1={padX}
        x2={w - padX}
        y1={y(50)}
        y2={y(50)}
        stroke="#e5e7eb"
        strokeDasharray="3 4"
      />

      <path d={area} fill="url(#socketScoreTrendFill)" />
      <path
        d={line}
        fill="none"
        stroke="#3B52C6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => (
        <g key={`${d.year}-${d.month}`}>
          <circle
            cx={x(i)}
            cy={y(d.cumulativeScore)}
            r="4"
            fill="#3B52C6"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <text
            x={x(i)}
            y={h - 1}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize="8"
          >
            {MONTHS[d.month - 1]?.slice(0, 3)}
          </text>
          <text
            x={x(i)}
            y={Math.max(9, y(d.cumulativeScore) - 8)}
            textAnchor="middle"
            className="fill-[#090f24] font-bold"
            fontSize="9"
          >
            {Number(d.cumulativeScore).toFixed(0)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "final").toLowerCase();
  const styles =
    value === "final"
      ? "bg-emerald-50 text-emerald-700"
      : value === "provisional"
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-100 text-gray-500";

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
        styles
      )}
    >
      {value}
    </span>
  );
}

function SectionError({ onRetry, label = "Retry" }) {
  return (
    <Card className="p-4 text-center shadow-sm">
      <AlertTriangle className="mx-auto size-5 text-danger-500" />
      <p className="mt-2 text-xs font-bold text-text-primary">
        Could not load this section
      </p>
      <p className="mt-0.5 text-[11px] text-text-secondary">
        Check your connection and try again.
      </p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        {label}
      </Button>
    </Card>
  );
}

export function SocketScorePage() {
  const navigate = useNavigate();
  const [finalizing, setFinalizing] = useState(false);

  const {
    data: summaryRes,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useAsync(getScoreSummary, []);
  const {
    data: breakdownRes,
    isLoading: loadingBreakdown,
    error: breakdownError,
    refetch: refetchBreakdown,
  } = useAsync(getScoreBreakdown, []);
  const {
    data: historyRes,
    isLoading: loadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useAsync(() => getMonthlyHistory({ limit: 24 }), []);
  const { data: explanationRes } = useAsync(getScoreExplanation, []);

  const summary = summaryRes?.data || summaryRes || {};
  const breakdownPayload = breakdownRes?.data || breakdownRes || {};
  const components = breakdownPayload.components || [];
  const history = historyRes?.data || historyRes || [];
  const explanation = explanationRes?.data || explanationRes || {};

  const cumulativeScore = Number(
    summary.cumulativeScore ?? summary.socketScore ?? 0
  );
  const currentMonthly = summary.currentMonthlyScore;
  const { label, tier } = getScoreRating(cumulativeScore);

  const animatedScore = useCountUp(cumulativeScore);

  const points = useMemo(() => {
    if (Array.isArray(history) && history.length) {
      return history.map((h) => ({
        month: h.month,
        year: h.year,
        monthlyScore: h.monthlyScore,
        cumulativeScore: h.cumulativeScore,
      }));
    }
    if (Number.isFinite(Number(currentMonthly))) {
      return [
        {
          month: summary.currentPeriod?.month,
          year: summary.currentPeriod?.year,
          monthlyScore: currentMonthly,
          cumulativeScore,
        },
      ];
    }
    return [];
  }, [history, currentMonthly, cumulativeScore, summary.currentPeriod]);

  async function handleFinalize() {
    const p = summary.lastFinalPeriod;
    // Finalize the month before the current one if available, else current.
    const now = new Date();
    let target = { year: now.getFullYear(), month: now.getMonth() };
    if (target.month === 0) target = { year: target.year - 1, month: 12 };
    if (p && p.month === target.month && p.year === target.year) {
      toast.success("Latest completed month is already finalized.");
      return;
    }
    setFinalizing(true);
    try {
      await finalizeMonthlyScore(target);
      toast.success("Monthly score finalized.");
      refetchSummary();
    } catch (e) {
      toast.error(e?.data?.message || e?.message || "Could not finalize month.");
    } finally {
      setFinalizing(false);
    }
  }

  const loading = loadingSummary || loadingBreakdown || loadingHistory;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#F8FAFC] pb-10 font-sans text-[#090f24] sm:max-w-2xl">
      <header className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-base font-bold tracking-tight">
            Your SocketScore
          </h1>
          <p className="text-[11px] text-gray-500">
            How your financial behaviour builds trust
          </p>
        </div>
      </header>

      <div className="space-y-4 px-4">
        {/* A. Main display */}
        {loadingSummary ? (
          <Card className="p-5 text-center shadow-sm">
            <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-gray-100" />
            <div className="mx-auto mt-4 size-[150px] animate-pulse rounded-full bg-gray-100" />
            <div className="mx-auto mt-4 h-3 w-16 animate-pulse rounded-full bg-gray-100" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          </Card>
        ) : summaryError ? (
          <SectionError onRetry={refetchSummary} />
        ) : (
          <Card className="p-5 text-center shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Cumulative SocketScore
            </p>
            <p className="text-[11px] text-gray-500">
              Your CGPA across all completed months
            </p>

            <div className="mt-3 flex justify-center">
              <ProgressRing score={Math.round(animatedScore)} size={150} strokeWidth={14} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#F1F4FE] p-2">
                <p className="text-[10px] font-bold uppercase text-gray-400">
                  This month
                </p>
                <p className="text-sm font-extrabold text-text-primary">
                  {currentMonthly === null || currentMonthly === undefined
                    ? "—"
                    : Number(currentMonthly).toFixed(1)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F1F4FE] p-2">
                <p className="text-[10px] font-bold uppercase text-gray-400">
                  Previous
                </p>
                <p className="text-sm font-extrabold text-text-primary">
                  {summary.previousMonthlyScore === null ||
                  summary.previousMonthlyScore === undefined
                    ? "—"
                    : Number(summary.previousMonthlyScore).toFixed(1)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F1F4FE] p-2">
                <p className="text-[10px] font-bold uppercase text-gray-400">
                  Change
                </p>
                <p
                  className={cn(
                    "flex items-center justify-center gap-0.5 text-sm font-extrabold",
                    Number(summary.changeFromPreviousMonth) >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  )}
                >
                  {Number(summary.changeFromPreviousMonth) >= 0 ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ArrowDownRight className="size-3.5" />
                  )}
                  {Number(summary.changeFromPreviousMonth || 0).toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Current period: {periodLabel(summary.currentPeriod)}
              </span>
              {summary.lastCalculatedAt && (
                <span>
                  · Last calculated{" "}
                  {new Date(summary.lastCalculatedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {summary.hasCompletedMonth ? null : (
              <p className="mt-2 text-[11px] text-amber-700">
                No completed scoring month yet — your current month builds
                provisionally and becomes final at month end.
              </p>
            )}

            <Button
              variant="secondary"
              className="mt-3"
              isLoading={finalizing}
              onClick={handleFinalize}
              icon={RefreshCw}
            >
              Finalize last month
            </Button>
          </Card>
        )}

        {/* B. Trend */}
        <Card className="p-4 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
            <TrendingUp className="size-4 text-[#3B52C6]" />
            Cumulative trend
          </h2>

          {loadingHistory ? (
            <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ) : historyError ? (
            <SectionError onRetry={refetchHistory} />
          ) : points.length < 1 ? (
            <p className="py-6 text-center text-xs text-gray-500">
              Complete a scoring month to see your trend.
            </p>
          ) : (
            <TrendChart points={points} />
          )}

          <p className="mt-1 text-[10px] text-gray-400">
            Cumulative score can rise or fall as each new month is added — like
            a university CGPA.
          </p>
        </Card>

        {/* C. Breakdown */}
        <div>
          <h2 className="mb-2 text-sm font-bold">Six components</h2>

          {loadingBreakdown ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-gray-100"
                />
              ))}
            </div>
          ) : breakdownError ? (
            <SectionError onRetry={refetchBreakdown} />
          ) : components.length === 0 ? (
            <Card className="p-4 text-center text-xs text-gray-500">
              No component breakdown available yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {components.map((item) => {
                const Icon =
                  ICON_MAP[item.code] || ICON_MAP[item.name] || Award;
                const eligible =
                  item.eligible !== false &&
                  item.rawScore !== null &&
                  item.rawScore !== undefined;
                const pct = eligible ? Number(item.rawScore) : 0;
                const weight = Number(item.weight || 0);
                const earned = eligible
                  ? Number(
                      item.contribution ?? (pct / 100) * weight
                    )
                  : 0;
                const max = Number(item.applicableMaximum ?? weight);

                return (
                  <Card key={item.code || item.name} className="p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F1F4FE] text-[#3B52C6]">
                        <Icon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-text-primary">
                            {item.name}
                          </p>
                          <span className="shrink-0 rounded-full bg-[#F1F4FE] px-2 py-0.5 text-[10px] font-bold text-[#3B52C6]">
                            Weight {weight}
                          </span>
                        </div>

                        {eligible ? (
                          <>
                            <p className="mt-0.5 text-xs font-semibold text-text-primary">
                              {earned.toFixed(2)} / {max} points ·{" "}
                              {pct.toFixed(1)}% performance
                            </p>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-[#3B52C6] animate-[growBar_0.7s_ease-out]"
                                style={{
                                  width: `${Math.min(100, Math.max(0, pct))}%`,
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                            Not applicable this month — weight redistributed
                            (not scored as 0).
                          </p>
                        )}

                        <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                          {HELP_MAP[item.code] ||
                            HELP_MAP[item.name] ||
                            item.description ||
                            "Your score improves when you consistently fulfil this part of your cooperative behaviour."}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly history */}
        <Card className="p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <CalendarDays className="size-4 text-[#3B52C6]" />
            Monthly history
          </h2>

          {loadingHistory ? (
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ) : historyError ? (
            <SectionError onRetry={refetchHistory} />
          ) : history.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-500">
              No scoring history yet. Your first completed month will appear
              here.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="bg-[#F1F4FE] text-[10px] uppercase text-gray-500">
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Monthly</th>
                    <th className="px-3 py-2">Cumulative</th>
                    <th className="px-3 py-2">Δ</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h) => (
                    <tr
                      key={h._id || `${h.year}-${h.month}`}
                      className="border-t border-gray-100"
                    >
                      <td className="px-3 py-2 font-semibold">
                        {periodLabel({ year: h.year, month: h.month })}
                      </td>
                      <td className="px-3 py-2">
                        {Number(h.monthlyScore).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 font-semibold">
                        {Number(h.cumulativeScore).toFixed(1)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 font-semibold",
                          Number(h.delta) >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        )}
                      >
                        {Number(h.delta) >= 0 ? "+" : ""}
                        {Number(h.delta || 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={h.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* D. How it works */}
        <Card className="border-blue-100 bg-blue-50/50 p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#1d2d6d]">
            <CircleHelp className="size-4" />
            How Your SocketScore Works
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12px] leading-relaxed text-gray-700">
            <li>SocketScore measures your financial consistency and reliability.</li>
            <li>Your score is made up of six components.</li>
            <li>
              Each component contributes to a maximum of 100 points (currently{" "}
              {explanation.weightsTotal || 100} total weight).
            </li>
            <li>Your monthly score represents your performance during that month.</li>
            <li>Your cumulative score works like a university CGPA.</li>
            <li>Every eligible completed month contributes to your cumulative score.</li>
            <li>
              Your cumulative score can increase or decrease depending on your
              latest performance.
            </li>
            <li>
              Your historical results are preserved — even if weights change
              later, old months keep their original scores.
            </li>
          </ol>
          {explanation.example && (
            <p className="mt-2 rounded-xl bg-white p-2 text-[11px] font-semibold text-[#1d2d6d]">
              Example — {explanation.example}
            </p>
          )}
          {explanation.eligibilityRule && (
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              {explanation.eligibilityRule}
            </p>
          )}
          {explanation.formula && (
            <p className="mt-2 text-[10px] text-gray-400">{explanation.formula}</p>
          )}
        </Card>

        {/* E. Improve */}
        <Card className="p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-bold">
            <Target className="size-4 text-[#3B52C6]" />
            How to improve your SocketScore
          </h2>
          <ul className="mt-2 space-y-1.5">
            {TIPS.map((t) => (
              <li
                key={t}
                className="flex items-start gap-2 text-[12px] text-gray-700"
              >
                <Info className="mt-0.5 size-3.5 shrink-0 text-[#3B52C6]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
