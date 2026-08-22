import { Ticket, UserCheck, MessageSquare } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAsync } from "@/hooks/useAsync";
import { getSupportTickets, getReferralVerifications } from "@/services/supportService";
import { LoadingState } from "@/components/feedback/LoadingState";

export function SupportDashboard() {
  const { data: ticketsData, isLoading: loadingTickets } = useAsync(() => getSupportTickets({ status: "open" }), []);
  const { data: referralsData, isLoading: loadingReferrals } = useAsync(() => getReferralVerifications({ status: "pending" }), []);

  const openTickets = ticketsData?.total || ticketsData?.data?.length || 0;
  const pendingReferrals = referralsData?.total || referralsData?.data?.length || 0;

  if (loadingTickets || loadingReferrals) return <LoadingState rows={2} />;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary">Support Overview</h1>
      <p className="mt-1 text-sm text-text-secondary">Complaints and referral verification.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard icon={Ticket} label="Open Tickets" value={openTickets} trend="Need attention" />
        <StatCard icon={MessageSquare} label="Resolved This Month" value="45" trend="This month" />
        <StatCard icon={UserCheck} label="Referral Verifications" value={pendingReferrals} trend="Pending" />
      </div>
    </div>
  );
}