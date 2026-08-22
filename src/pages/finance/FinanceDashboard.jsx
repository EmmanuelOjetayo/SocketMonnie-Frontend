import { PiggyBank, Landmark, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAsync } from "@/hooks/useAsync";
import { getFinanceOverview } from "@/services/financeService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { formatNaira } from "@/utils/format";

export function FinanceDashboard() {
  const { data, isLoading } = useAsync(getFinanceOverview, []);
  const stats = data?.stats || {};

  if (isLoading) return <LoadingState rows={2} />;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary">Finance Overview</h1>
      <p className="mt-1 text-sm text-text-secondary">Monitor savings and repayments.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard icon={PiggyBank} label="Total Savings" value={formatNaira(stats.totalSavings || 0)} trend={`+${stats.savingsGrowth || 0}%`} />
        <StatCard icon={Landmark} label="Active Loans" value={formatNaira(stats.activeLoansTotal || 0)} trend={`${stats.activeLoansCount || 0} loans`} />
        <StatCard icon={TrendingUp} label="Repayments" value={formatNaira(stats.totalRepayments || 0)} trend={`+${stats.repaymentGrowth || 0}%`} />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-text-primary mb-3">Recent Transactions</h2>
        <Card className="p-4">
          {stats.recentTransactions?.length ? (
            <div className="space-y-2">
              {stats.recentTransactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between text-sm border-b border-border pb-2">
                  <span>{tx.description}</span>
                  <span className="font-medium">{formatNaira(tx.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No recent transactions</p>
          )}
        </Card>
      </div>
    </div>
  );
}