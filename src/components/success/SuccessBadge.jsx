/**
 * Starburst seal with a centered check. Pure SVG, no dependencies.
 *
 * Tone:
 *  - success (green, default)
 *  - pending (amber)
 *  - failed  (red)
 *
 * Success/pending/failed all share the same visual language; the fill/stroke
 * and check color change with the tone.
 */

// Build a starburst polygon: even-index points on the outer circle, odd on the
// inner circle.
const buildStar = (points = 12, outer = 50, inner = 42, cx = 50, cy = 50) => {
  const out = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    out.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return out.join(" ");
};

const STAR = buildStar();

const TONES = {
  success: { fill: "#16A34A", stroke: "#16A34A" },
  pending: { fill: "#F59E0B", stroke: "#F59E0B" },
  failed: { fill: "#EF4444", stroke: "#EF4444" },
};

const SIZE = 112;

export default function SuccessBadge({ size = SIZE, tone = "success", className = "" }) {
  const t = TONES[tone] || TONES.success;

  // Check icon for successful states; a simple mark for pending/failed.
  const check = (
    <path
      d="M31 51 L44 64 L69 37"
      fill="none"
      stroke="#fff"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const pendingMark = tone === "pending" ? (
    <path
      d="M50 34v20"
      fill="none"
      stroke="#fff"
      strokeWidth="5"
      strokeLinecap="round"
    />
  ) : null;
  const pendingDot = tone === "pending" ? (
    <circle cx="50" cy="64" r="3.4" fill="#fff" />
  ) : null;
  const failedMark = tone === "failed" ? (
    <path
      d="M38 38l24 24M62 38L38 62"
      fill="none"
      stroke="#fff"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
  ) : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={
        tone === "success" ? "Success" : tone === "pending" ? "Pending" : "Failed"
      }
    >
      <polygon
        points={STAR}
        fill={t.fill}
        stroke={t.stroke}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {tone === "success" && check}
      {pendingMark}
      {pendingDot}
      {failedMark}
    </svg>
  );
}
