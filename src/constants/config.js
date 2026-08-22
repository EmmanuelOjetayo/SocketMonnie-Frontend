// Runtime + business-rule constants sourced from the PRD and Figma.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Savings Plans (PRD)
export const SAVINGS_PLANS = [
  { id: "bronze", label: "Bronze", min: 5000, max: 20000 },
  { id: "silver", label: "Silver", min: 21000, max: 50000 },
  { id: "gold", label: "Gold", min: 51000, max: 100000 },
  { id: "platinum", label: "Platinum", min: 100000, max: null },
];

export const MIN_MONTHLY_SAVINGS = import.meta.env.VITE_MIN_MONTHLY_SAVINGS || 5000;

// Loan durations (months)
export const LOAN_DURATIONS = [
  { value: "12", label: "12 Months" },
];

// Loan types (from Figma)
export const LOAN_TYPES = [
  { value: "cooperative", label: "Cooperative Loan" },
  { value: "emergency", label: "Emergency Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "business", label: "Business Loan" },
];

// Disbursement methods (from Figma)
export const DISBURSEMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wallet", label: "Wallet Balance" },
];

// Late payment penalty (PRD)
export const LATE_PAYMENT_PENALTY_RATE = import.meta.env.VITE_LATE_PAYMENT_PENALTY_RATE || 0.02; // 2% monthly

// Withdrawal fee
export const WITHDRAWAL_FEE = 100;

// Socket Score rating bands (PRD)
export const SCORE_BANDS = [
  { min: 90, max: 100, label: "A+ Elite", tier: "elite" },
  { min: 80, max: 89, label: "A Excellent", tier: "excellent" },
  { min: 70, max: 79, label: "B Good", tier: "good" },
  { min: 60, max: 69, label: "C Fair", tier: "fair" },
  { min: 0, max: 59, label: "D Risky", tier: "risky" },
];