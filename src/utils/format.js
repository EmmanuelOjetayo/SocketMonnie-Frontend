import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatNaira(amount, { decimals = 0 } = {}) {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(isoString, pattern = "MMM dd, yyyy") {
  if (!isoString) return "";
  const date = typeof isoString === "string" ? parseISO(isoString) : isoString;
  return format(date, pattern);
}

export function formatRelative(isoString) {
  if (!isoString) return "";
  const date = typeof isoString === "string" ? parseISO(isoString) : isoString;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getScoreRating(score) {
  if (score >= 90) return { label: "A+ Elite", tier: "elite" };
  if (score >= 80) return { label: "A Excellent", tier: "excellent" };
  if (score >= 70) return { label: "B Good", tier: "good" };
  if (score >= 60) return { label: "C Fair", tier: "fair" };
  return { label: "D Risky", tier: "risky" };
}