export const mockSavingsSummary = {
  totalSaved: 184500,
  monthlyTarget: 25000,
  monthlyContributed: 25000,
  growthRatePct: 12.4,
  streakMonths: 8,
};

export const mockSavingsHistory = [
  { id: "sv_1", date: "2026-07-02", amount: 25000, type: "deposit", method: "Bank Transfer" },
  { id: "sv_2", date: "2026-06-03", amount: 25000, type: "deposit", method: "Card" },
  { id: "sv_3", date: "2026-05-04", amount: 20000, type: "deposit", method: "Bank Transfer" },
  { id: "sv_4", date: "2026-04-02", amount: 25000, type: "deposit", method: "Wallet" },
  { id: "sv_5", date: "2026-03-05", amount: 15000, type: "deposit", method: "Bank Transfer" },
];

export const mockMonthlyReport = [
  { month: "Feb", amount: 18000 },
  { month: "Mar", amount: 15000 },
  { month: "Apr", amount: 25000 },
  { month: "May", amount: 20000 },
  { month: "Jun", amount: 25000 },
  { month: "Jul", amount: 25000 },
];
