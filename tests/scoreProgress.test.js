/**
 * SocketScore presentation helpers — unit tests.
 * Run: node --test tests/scoreProgress.test.js
 *
 * These guard the rules the member score screen depends on:
 *  - a score maps to the right band, and progress to the next band is honest
 *  - a component's lesson state reflects its real performance
 *  - a streak only counts months the backend actually finalized
 *  - evidence summaries use the backend's own numbers
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  bandFor,
  nextLevelProgress,
  classifyComponent,
  computeStreak,
  summarizeEvidence,
  nextActionFor,
} from "../src/utils/scoreProgress.js";

/* ------------------------------------------------------------------ */
/* Bands                                                               */
/* ------------------------------------------------------------------ */

test("a score maps to the right band", () => {
  assert.equal(bandFor(95).label, "A+ Elite");
  assert.equal(bandFor(85).label, "A Excellent");
  assert.equal(bandFor(75).label, "B Good");
  assert.equal(bandFor(65).label, "C Fair");
  assert.equal(bandFor(20).label, "D Risky");
  assert.equal(bandFor(0).label, "D Risky");
});

test("an out-of-range score is clamped", () => {
  assert.equal(bandFor(150).label, "A+ Elite");
  assert.equal(bandFor(-5).label, "D Risky");
});

test("progress toward the next band is measured against that band only", () => {
  const progress = nextLevelProgress(75);

  assert.equal(progress.current.label, "B Good");
  assert.equal(progress.next.label, "A Excellent");
  assert.equal(progress.pointsToNext, 5);
  assert.equal(progress.percent, 50);
});

test("the top band reports no next level", () => {
  const progress = nextLevelProgress(95);

  assert.equal(progress.next, null);
  assert.equal(progress.pointsToNext, 0);
  assert.equal(progress.percent, 100);
});

test("a score below the lowest band still points at the next one up", () => {
  const progress = nextLevelProgress(40);

  assert.equal(progress.current.label, "D Risky");
  assert.equal(progress.next.label, "C Fair");
  assert.equal(progress.pointsToNext, 20);
  // Progress is measured across the whole band (0 → 60), not from zero.
  assert.equal(Math.round(progress.percent), 67);
});

/* ------------------------------------------------------------------ */
/* Component states                                                    */
/* ------------------------------------------------------------------ */

test("a strong component is mastered", () => {
  assert.equal(classifyComponent(90).key, "mastered");
  assert.equal(classifyComponent(85).key, "mastered");
});

test("a middling component is a lesson in progress", () => {
  assert.equal(classifyComponent(75).key, "almost");
  assert.equal(classifyComponent(60).key, "learning");
  assert.equal(classifyComponent(40).key, "needs_work");
});

test("an ineligible component is never scored", () => {
  const state = classifyComponent(null, false);

  assert.equal(state.key, "inactive");
  assert.equal(state.label, "Not applicable");
});

/* ------------------------------------------------------------------ */
/* Streak                                                              */
/* ------------------------------------------------------------------ */

test("a streak counts consecutive finalized months", () => {
  const history = [
    { year: 2026, month: 8, status: "final" },
    { year: 2026, month: 9, status: "final" },
    { year: 2026, month: 10, status: "final" },
  ];

  assert.equal(computeStreak(history), 3);
});

test("a provisional month breaks the streak", () => {
  const history = [
    { year: 2026, month: 8, status: "final" },
    { year: 2026, month: 9, status: "final" },
    { year: 2026, month: 10, status: "provisional" },
  ];

  assert.equal(computeStreak(history), 0);
});

test("a gap between months breaks the streak", () => {
  const history = [
    { year: 2026, month: 7, status: "final" },
    { year: 2026, month: 9, status: "final" },
  ];

  assert.equal(computeStreak(history), 1);
});

test("unsorted history still produces the right streak", () => {
  const history = [
    { year: 2026, month: 10, status: "final" },
    { year: 2026, month: 8, status: "final" },
    { year: 2026, month: 9, status: "final" },
  ];

  assert.equal(computeStreak(history), 3);
});

test("no history means no streak", () => {
  assert.equal(computeStreak([]), 0);
  assert.equal(computeStreak(null), 0);
});

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

test("savings consistency evidence uses the backend's own figures", () => {
  const summary = summarizeEvidence({
    code: "savings_consistency",
    evidence: { totalDeposited: 25000, expectedCommitment: 50000, minutesDeposited: 0 },
  });

  assert.ok(summary.includes("25,000"));
  assert.ok(summary.includes("50,000"));
});

test("loan repayment evidence counts instalments", () => {
  const summary = summarizeEvidence({
    code: "loan_repayment",
    evidence: { totalDue: 3, onTime: 2 },
  });

  assert.equal(summary, "2 of 3 instalments paid on time");
});

test("profile completion evidence counts items", () => {
  const summary = summarizeEvidence({
    code: "profile_completion",
    evidence: { completedItems: 6, totalItems: 8 },
  });

  assert.equal(summary, "6 of 8 profile items complete");
});

test("no evidence means no summary line", () => {
  assert.equal(summarizeEvidence({ code: "loan_repayment", evidence: {} }), null);
  assert.equal(summarizeEvidence(null), null);
});

/* ------------------------------------------------------------------ */
/* Next actions                                                        */
/* ------------------------------------------------------------------ */

test("a savings shortfall produces a concrete next action", () => {
  const action = nextActionFor({
    code: "savings_consistency",
    rawScore: 60,
    eligible: true,
    evidence: { totalDeposited: 25000, expectedCommitment: 50000 },
  });

  assert.ok(action.includes("25,000"));
});

test("a mastered component needs no action", () => {
  const action = nextActionFor({
    code: "savings_consistency",
    rawScore: 95,
    eligible: true,
    evidence: { totalDeposited: 50000, expectedCommitment: 50000 },
  });

  assert.equal(action, null);
});

test("an ineligible component needs no action", () => {
  const action = nextActionFor({
    code: "loan_repayment",
    rawScore: null,
    eligible: false,
    evidence: {},
  });

  assert.equal(action, null);
});
