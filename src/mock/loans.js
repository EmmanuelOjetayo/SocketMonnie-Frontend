export const mockActiveLoan = {
  id: "ln_2201",
  amount: 100000,
  outstandingBalance: 68000,
  interestRate: 7.5,
  durationMonths: 6,
  status: "active", // active | pending | completed | overdue
  nextDueDate: "2026-08-05",
  nextDueAmount: 18700,
  disbursedDate: "2026-04-05",
};

export const mockLoanHistory = [
  { id: "ln_2201", amount: 100000, status: "active", durationMonths: 6, appliedDate: "2026-04-01" },
  { id: "ln_2110", amount: 50000, status: "completed", durationMonths: 3, appliedDate: "2025-11-02" },
  { id: "ln_2054", amount: 30000, status: "completed", durationMonths: 1, appliedDate: "2025-07-14" },
];

export const mockRepaymentSchedule = [
  { id: "rp_1", dueDate: "2026-05-05", amount: 18700, status: "paid" },
  { id: "rp_2", dueDate: "2026-06-05", amount: 18700, status: "paid" },
  { id: "rp_3", dueDate: "2026-07-05", amount: 18700, status: "paid" },
  { id: "rp_4", dueDate: "2026-08-05", amount: 18700, status: "upcoming" },
  { id: "rp_5", dueDate: "2026-09-05", amount: 18700, status: "upcoming" },
];
