// Relative import (not the "@/" alias) so this module can be exercised
// directly by the node:test suite — same convention as the receipt engine.
import { formatNaira } from "./format.js";

/**
 * SocketScore presentation helpers.
 *
 * Pure functions that turn the backend's score records into the small,
 * friendly primitives the member score screen is built from: score bands,
 * progress toward the next band, lesson-style component states, streaks and
 * plain-language evidence summaries.
 *
 * Nothing here invents data — every value comes from a score record.
 */

/** Score bands, highest first. Mirrors getScoreRating() in utils/format. */
export const SCORE_BANDS = [
  { min: 90, label: "A+ Elite", tier: "elite", color: "#17b26a" },
  { min: 80, label: "A Excellent", tier: "excellent", color: "#5b76e1" },
  { min: 70, label: "B Good", tier: "good", color: "#2b9cf2" },
  { min: 60, label: "C Fair", tier: "fair", color: "#f59e0b" },
  { min: 0, label: "D Risky", tier: "risky", color: "#ef4444" },
];

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);

/** The band a score falls into. */
export function bandFor(score) {
  const value = clamp(score, 0, 100);
  return SCORE_BANDS.find((band) => value >= band.min) || SCORE_BANDS[SCORE_BANDS.length - 1];
}

/**
 * Progress from the current band toward the next one.
 *
 * @returns {{current: object, next: object|null, pointsToNext: number, percent: number}}
 */
export function nextLevelProgress(score) {
  const value = clamp(score, 0, 100);
  const index = SCORE_BANDS.findIndex((band) => value >= band.min);
  const current = SCORE_BANDS[index] || SCORE_BANDS[SCORE_BANDS.length - 1];
  const next = index > 0 ? SCORE_BANDS[index - 1] : null;

  if (!next) {
    return { current, next: null, pointsToNext: 0, percent: 100 };
  }

  const span = next.min - current.min;
  const percent = span > 0 ? clamp(((value - current.min) / span) * 100, 0, 100) : 100;

  return {
    current,
    next,
    pointsToNext: Math.max(0, Math.round((next.min - value) * 10) / 10),
    percent,
  };
}

/**
 * Lesson-style state for a score component.
 *
 * "mastered" / "almost" / "learning" / "needs_work" / "inactive" — the
 * component cards read like a learning path without implying anything the
 * backend does not actually measure.
 */
export function classifyComponent(rawScore, eligible = true) {
  if (eligible === false || rawScore === null || rawScore === undefined) {
    return {
      key: "inactive",
      label: "Not applicable",
      color: "#94a3b8",
      softBg: "bg-slate-50",
      textClass: "text-slate-500",
      borderClass: "border-slate-200",
    };
  }

  const value = clamp(rawScore, 0, 100);

  if (value >= 85) {
    return {
      key: "mastered",
      label: "Mastered",
      color: "#17b26a",
      softBg: "bg-emerald-50",
      textClass: "text-emerald-600",
      borderClass: "border-emerald-200",
    };
  }
  if (value >= 70) {
    return {
      key: "almost",
      label: "Almost there",
      color: "#3b5bdb",
      softBg: "bg-[#eef1fd]",
      textClass: "text-[#3b5bdb]",
      borderClass: "border-[#bdc8f3]",
    };
  }
  if (value >= 50) {
    return {
      key: "learning",
      label: "Keep going",
      color: "#f59e0b",
      softBg: "bg-amber-50",
      textClass: "text-amber-600",
      borderClass: "border-amber-200",
    };
  }
  return {
    key: "needs_work",
    label: "Needs work",
    color: "#ef4444",
    softBg: "bg-rose-50",
    textClass: "text-rose-600",
    borderClass: "border-rose-200",
  };
}

/**
 * Consecutive finalized months, counting back from the most recent record.
 * Only months the backend has finalized ("final") count.
 */
export function computeStreak(history) {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const sorted = [...history].sort(
    (a, b) => (Number(a.year) - Number(b.year)) || (Number(a.month) - Number(b.month))
  );

  let streak = 0;
  let expected = null;

  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const row = sorted[i];
    if (String(row?.status || "").toLowerCase() !== "final") break;

    if (expected) {
      const gap = (expected.year - Number(row.year)) * 12 + (expected.month - Number(row.month));
      if (gap !== 1) break;
    }

    streak += 1;
    expected = { year: Number(row.year), month: Number(row.month) };
  }

  return streak;
}

/**
 * A one-line, human summary of the evidence behind a component.
 * Returns null when there is nothing meaningful to show.
 */
export function summarizeEvidence(component) {
  if (!component) return null;

  const evidence = component.evidence || {};
  const code = component.code;

  if (code === "savings_consistency") {
    const saved = Number(evidence.totalDeposited || 0);
    const target = Number(evidence.expectedCommitment || 0);
    if (!target) return null;
    const minutes = Number(evidence.minutesDeposited || 0);
    const base = `${formatNaira(saved)} of ${formatNaira(target)} saved this month`;
    return minutes > 0 ? `${base} (incl. ${formatNaira(minutes)} SocketMinutes)` : base;
  }

  if (code === "savings_growth") {
    const from = Number(evidence.startBalance || 0);
    const to = Number(evidence.endBalance || 0);
    if (!from && !to) return null;
    const delta = to - from;
    const sign = delta >= 0 ? "+" : "-";
    return `Balance ${formatNaira(from)} → ${formatNaira(to)} (${sign}${formatNaira(Math.abs(delta))})`;
  }

  if (code === "loan_repayment") {
    const due = Number(evidence.totalDue || 0);
    const onTime = Number(evidence.onTime || 0);
    if (!due) return null;
    return `${onTime} of ${due} instalment${due === 1 ? "" : "s"} paid on time`;
  }

  if (code === "withdrawal_behaviour") {
    const withdrawn = Number(evidence.totalWithdrawn || 0);
    const balance = Number(evidence.startBalance || 0);
    if (!withdrawn) return null;
    return `${formatNaira(withdrawn)} withdrawn of ${formatNaira(balance)} opening balance`;
  }

  if (code === "profile_completion") {
    const done = Number(evidence.completedItems || 0);
    const total = Number(evidence.totalItems || 0);
    if (!total) return null;
    return `${done} of ${total} profile items complete`;
  }

  if (code === "community_trust") {
    const referrals = Number(evidence.qualifiedReferrals || 0);
    const guarantors = Number(evidence.guarantorCount || 0);
    if (!referrals && !guarantors) return null;
    return `${referrals} qualified referral${referrals === 1 ? "" : "s"} · ${guarantors} guarantor role${guarantors === 1 ? "" : "s"}`;
  }

  return null;
}

/**
 * The next actionable step for a component, derived from its own evidence.
 * Returns null for components that are already mastered or not applicable.
 */
export function nextActionFor(component, classify = classifyComponent) {
  if (!component) return null;

  const eligible = component.eligible !== false && component.rawScore !== null && component.rawScore !== undefined;
  if (!eligible) return null;

  const state = classify(component.rawScore, eligible);
  if (state.key === "mastered") return null;

  const evidence = component.evidence || {};

  if (component.code === "savings_consistency") {
    const saved = Number(evidence.totalDeposited || 0);
    const target = Number(evidence.expectedCommitment || 0);
    if (target > 0 && saved < target) {
      return `Save ${formatNaira(Math.max(0, target - saved))} more to hit your commitment`;
    }
  }

  if (component.code === "loan_repayment") {
    const due = Number(evidence.totalDue || 0);
    const onTime = Number(evidence.onTime || 0);
    if (due > onTime) return `Pay ${due - onTime} remaining instalment${due - onTime === 1 ? "" : "s"} on time`;
  }

  if (component.code === "profile_completion") {
    const done = Number(evidence.completedItems || 0);
    const total = Number(evidence.totalItems || 0);
    if (total > done) return `Complete ${total - done} more profile item${total - done === 1 ? "" : "s"}`;
  }

  if (component.code === "community_trust") {
    const referrals = Number(evidence.qualifiedReferrals || 0);
    if (referrals < 5) return `Refer ${5 - referrals} more member${5 - referrals === 1 ? "" : "s"} to reach full marks`;
  }

  if (state.key === "needs_work") return "Review this part of your score";
  return "Keep this part strong";
}
