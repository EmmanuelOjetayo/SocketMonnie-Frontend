import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
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
  Flame,
  ChevronRight,
  Trophy,
  Lock,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TopHeader } from "@/components/navigation/TopHeader";
import { useAsync } from "@/hooks/useAsync";
import {
  getScoreSummary,
  getScoreBreakdown,
  getMonthlyHistory,
  getScoreExplanation,
  finalizeMonthlyScore,
} from "@/services/scoreService";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import {
  bandFor,
  nextLevelProgress,
  classifyComponent,
  computeStreak,
  summarizeEvidence,
  nextActionFor,
} from "@/utils/scoreProgress";
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

/** Where a member goes to act on each component. */
const COMPONENT_ROUTES = {
  savings_consistency: ROUTES.SAVINGS_DEPOSIT,
  savings_growth: ROUTES.SAVINGS,
  loan_repayment: ROUTES.LOANS,
  withdrawal_behaviour: ROUTES.SAVINGS,
  profile_completion: ROUTES.PROFILE,
  community_trust: ROUTES.REFERRALS || ROUTES.DASHBOARD,
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
  "Participate honestly — verified referrals and legitimate guarantor roles build trust.",
  "Do not borrow unnecessarily just to improve your score, and do not avoid legitimate withdrawals out of fear.",
];

function periodLabel(p) {
  if (!p?.year || !p?.month) return "—";
  return `${MONTHS[p.month - 1] || p.month} ${p.year}`;
}

/**
 * Ease-out count-up used for the headline score.
 *
 * The state is seeded with the real score so a throttled/hidden tab (where
 * requestAnimationFrame may not fire) can never leave a member looking at a
 * wrong number, and a timer forces the exact value shortly after the
 * animation should have finished.
 */
function useCountUp(target, duration = 900) {
  const numeric = Number(target || 0);
  const [value, setValue] = useState(numeric);

  useEffect(() => {
    let raf;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(numeric * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(numeric);
    };

    raf = requestAnimationFrame(tick);

    // Safety net: always settle on the exact score.
    const settle = setTimeout(() => setValue(numeric), duration + 250);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [numeric, duration]);

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
    h - padY - ((Number(v || 0)) / max) * (h - padY * 2);

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
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : value === "provisional"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-gray-100 text-gray-500 border border-gray-200";

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

/** Small stat pill used in the page header (same language as Savings). */
function HeaderPill({ icon: Icon, label, value, tone = "default" }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          tone === "good" ? "bg-emerald-100 text-emerald-600" : "bg-[#eef1fd] text-[#3b5bdb]"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 truncate">
        <span className="block text-[10px] font-medium leading-tight text-gray-500">
          {label}
        </span>
        <span className="block truncate text-xs font-extrabold text-[#090f24]">
          {value}
        </span>
      </div>
    </div>
  );
}

export function SocketScorePage() {
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
  const explanation = explanationRes?.data || explanationRes || {};

  // Normalise the component list once so downstream memo dependencies stay
  // referentially stable between renders.
  const components = useMemo(() => {
    const list = breakdownRes?.data?.components ?? breakdownRes?.components;
    return Array.isArray(list) ? list : [];
  }, [breakdownRes]);

  const cumulativeScore = Number(
    summary.cumulativeScore ?? summary.socketScore ?? 0
  );
  const currentMonthly = summary.currentMonthlyScore;

  const animatedScore = useCountUp(cumulativeScore);

  // historyRes is a fresh object per fetch; normalise it once so downstream
  // memo dependencies stay referentially stable.
  const history = useMemo(
    () =>
      Array.isArray(historyRes?.data)
        ? historyRes.data
        : Array.isArray(historyRes)
        ? historyRes
        : [],
    [historyRes]
  );

  const points = useMemo(() => {
    if (history.length) {
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

  // --- Derived, Duolingo-style primitives (all from backend records) ---
  const band = bandFor(cumulativeScore);
  const level = useMemo(() => nextLevelProgress(cumulativeScore), [cumulativeScore]);
  const streak = useMemo(() => computeStreak(history), [history]);

  const lessons = useMemo(
    () =>
      components.map((item) => {
        const eligible =
          item.eligible !== false &&
          item.rawScore !== null &&
          item.rawScore !== undefined;
        const pct = eligible ? Number(item.rawScore) : 0;
        const weight = Number(item.weight || 0);
        const max = Number(item.applicableMaximum ?? weight);
        const earned = eligible ? (pct / 100) * max : 0;

        return {
          ...item,
          eligible,
          pct,
          max,
          earned,
          state: classifyComponent(eligible ? pct : null, eligible),
          evidence: summarizeEvidence(item),
          action: nextActionFor(item),
          Icon: ICON_MAP[item.code] || ICON_MAP[item.name] || Award,
        };
      }),
    [components]
  );

  const focusLessons = useMemo(
    () => lessons.filter((l) => l.eligible && l.state.key !== "mastered"),
    [lessons]
  );

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

  const monthlyLabel =
    currentMonthly === null || currentMonthly === undefined
      ? "—"
      : Number(currentMonthly).toFixed(1);

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* BRANDED PAGE HEADER (same treatment as the Savings page) */}
      <TopHeader
        variant="page"
        title="SocketScore"
        subtitle="How your financial behaviour builds trust"
        showBack
      >
        <div className="grid grid-cols-2 gap-2.5">
          <HeaderPill
            icon={TrendingUp}
            label="This month"
            value={loadingSummary ? "—" : `${monthlyLabel} pts`}
          />
          <HeaderPill
            icon={Award}
            label="Cumulative"
            value={loadingSummary ? "—" : `${cumulativeScore.toFixed(1)} pts`}
            tone="good"
          />
        </div>
      </TopHeader>

      <div className="space-y-4 px-4 pt-3 sm:px-6">
        {/* A. HERO — score, level and progress to the next band */}
        {loadingSummary ? (
          <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)" }}
            />
            <div className="relative space-y-3">
              <div className="h-3 w-28 animate-pulse rounded-full bg-white/25" />
              <div className="mx-auto h-[132px] w-[132px] animate-pulse rounded-full bg-white/25" />
              <div className="h-2.5 w-full animate-pulse rounded-full bg-white/20" />
            </div>
          </div>
        ) : summaryError ? (
          <SectionError onRetry={refetchSummary} />
        ) : (
          <div
            className="relative overflow-hidden rounded-2xl p-4 text-white shadow-md sm:p-5"
            style={{ background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#dee3f9]">
                Cumulative SocketScore
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                <Trophy className="size-3" />
                {band.label}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="shrink-0 rounded-full bg-white p-1.5 shadow-md">
                <ProgressRing
                  score={Math.round(animatedScore)}
                  size={112}
                  strokeWidth={11}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white/70">
                  {cumulativeScore.toFixed(1)} / 100 points
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {streak > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                      <Flame className="size-3" />
                      {streak} month streak
                    </span>
                  )}
                  {summary.eligibleMonths > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                      {summary.eligibleMonths} scored month
                      {summary.eligibleMonths === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {/* Progress toward the next band */}
                {level.next ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/80">
                      <span>{level.current.label}</span>
                      <span>
                        {level.pointsToNext} pts to {level.next.label}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${level.percent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-white/15 px-2.5 py-1.5 text-[10px] font-bold text-white">
                    <Trophy className="size-3" />
                    Top band reached — keep it there
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-[10px] text-white/70">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3" />
                Current period: {periodLabel(summary.currentPeriod)}
              </span>
              {summary.lastCalculatedAt && (
                <span>
                  Last calculated{" "}
                  {new Date(summary.lastCalculatedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {!summary.hasCompletedMonth && (
              <p className="mt-2 rounded-xl bg-amber-400/15 px-2.5 py-1.5 text-[10px] font-semibold text-amber-100">
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
          </div>
        )}

        {/* B. MONTHLY PULSE — this month vs previous */}
        {!loadingSummary && !summaryError && (
          <div className="grid grid-cols-3 gap-2">
            <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                This month
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-[#090f24]">
                {monthlyLabel}
              </p>
            </Card>

            <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Previous
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-[#090f24]">
                {summary.previousMonthlyScore === null ||
                summary.previousMonthlyScore === undefined
                  ? "—"
                  : Number(summary.previousMonthlyScore).toFixed(1)}
              </p>
            </Card>

            <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Change
              </p>
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-0.5 text-sm font-extrabold",
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
            </Card>
          </div>
        )}

        {/* C. NEXT STEPS — the actionable goals (Duolingo-style daily goals) */}
        {!loadingBreakdown && !breakdownError && focusLessons.length > 0 && (
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#090f24]">
                <Target className="size-4 text-[#3b5bdb]" />
                Your next steps
              </h2>
              <span className="rounded-full bg-[#eef1fd] px-2 py-0.5 text-[10px] font-bold text-[#3b5bdb]">
                {focusLessons.length} to work on
              </span>
            </div>

            <div className="space-y-2">
              {focusLessons.map((lesson) => {
                const Icon = lesson.Icon;
                const route = COMPONENT_ROUTES[lesson.code] || ROUTES.DASHBOARD;

                return (
                  <Link
                    key={lesson.code || lesson.name}
                    to={route}
                    className="flex items-center gap-3 rounded-xl border border-[#dee3f9] bg-[#f7f9ff] p-2.5 transition hover:bg-[#eef1fd] active:scale-[0.99]"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        lesson.state.softBg,
                        lesson.state.textClass
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-[#090f24]">
                        {lesson.name}
                      </p>
                      <p className="truncate text-[10px] font-medium text-gray-500">
                        {lesson.action || lesson.evidence}
                      </p>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-[#c7cbe0]" />
                  </Link>
                );
              })}
            </div>
          </Card>
        )}

        {/* D. COMPONENTS — the six lessons */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#090f24]">Six components</h2>
            <span className="text-[10px] font-semibold text-gray-400">
              Total weight {explanation.weightsTotal || 100}
            </span>
          </div>

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
          ) : lessons.length === 0 ? (
            <Card className="p-4 text-center text-xs text-gray-500">
              No component breakdown available yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const Icon = lesson.Icon;

                return (
                  <Card
                    key={lesson.code || lesson.name}
                    className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          lesson.state.softBg,
                          lesson.state.textClass
                        )}
                      >
                        {lesson.eligible ? (
                          <Icon className="size-5" />
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-[#090f24]">
                            {lesson.name}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                              lesson.state.borderClass,
                              lesson.state.textClass
                            )}
                          >
                            {lesson.state.label}
                          </span>
                        </div>

                        {lesson.eligible ? (
                          <>
                            <p className="mt-1 text-xs font-semibold text-[#090f24]">
                              {lesson.earned.toFixed(2)} / {lesson.max} points ·{" "}
                              {lesson.pct.toFixed(1)}% performance
                            </p>

                            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#eef1fd]">
                              <div
                                className="h-full rounded-full transition-[width] duration-700 ease-out"
                                style={{
                                  width: `${Math.min(100, Math.max(0, lesson.pct))}%`,
                                  backgroundColor: lesson.state.color,
                                }}
                              />
                            </div>

                            {lesson.evidence && (
                              <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#f7f9ff] px-2 py-1 text-[10px] font-semibold text-[#3b5bdb]">
                                <Info className="size-3 shrink-0" />
                                {lesson.evidence}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              Not applicable this month — weight redistributed
                              (not scored as 0).
                            </p>
                            {lesson.note && (
                              <p className="mt-1 text-[10px] font-medium text-amber-600/80">
                                {lesson.note}
                              </p>
                            )}
                          </>
                        )}

                        <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                          {HELP_MAP[lesson.code] ||
                            HELP_MAP[lesson.name] ||
                            lesson.description ||
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

        {/* E. TREND */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#090f24]">
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

        {/* F. MONTHLY HISTORY */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#090f24]">
              <CalendarDays className="size-4 text-[#3B52C6]" />
              Monthly history
            </h2>
            {history.length > 0 && (
              <span className="text-[10px] font-semibold text-gray-400">
                {history.length} month{history.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

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
            <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              {[...history].reverse().map((h) => {
                const delta = Number(h.delta || 0);
                return (
                  <div
                    key={h._id || `${h.year}-${h.month}`}
                    className="flex items-center gap-3 rounded-xl border border-[#eef1fd] bg-[#f7f9ff] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-[#090f24]">
                        {periodLabel({ year: h.year, month: h.month })}
                      </p>
                      <p className="text-[10px] font-medium text-gray-500">
                        Cumulative {Number(h.cumulativeScore || 0).toFixed(1)}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 text-[12px] font-extrabold",
                        delta >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(1)}
                    </span>

                    <span className="w-12 shrink-0 text-right text-[13px] font-extrabold text-[#090f24]">
                      {Number(h.monthlyScore || 0).toFixed(1)}
                    </span>

                    <StatusBadge status={h.status} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* G. HOW IT WORKS */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-[#eef1fd]/60 p-4 shadow-sm">
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

        {/* H. TIPS */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#090f24]">
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
