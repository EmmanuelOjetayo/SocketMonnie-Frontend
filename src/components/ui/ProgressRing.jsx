import { getScoreRating } from "@/utils/format";

const TIER_COLORS = {
  elite: "#17b26a",
  excellent: "#5b76e1",
  good: "#2b9cf2",
  fair: "#f59e0b",
  risky: "#ef4444",
};

/**
 * Circular gauge for the Socket Score (0-100). Used on the dashboard
 * and the score-breakdown screen.
 */
export function ProgressRing({ score = 0, size = 132, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circumference * (1 - progress);
  const { label, tier } = getScoreRating(score);
  const color = TIER_COLORS[tier];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#eef0f8" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-text-primary">{score}</span>
        <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      </div>
    </div>
  );
}