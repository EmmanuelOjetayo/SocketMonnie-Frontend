import { useState } from "react";
import toast from "react-hot-toast";
import { Gift, Copy, Share2, Users, Star } from "lucide-react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getReferralActivity, getReferralStats } from "@/services/referralService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";

const SHARE_OPTIONS = [
  { id: "whatsapp", label: "WhatsApp", color: "bg-green-500" },
  { id: "twitter", label: "X (Twitter)", color: "bg-black" },
  { id: "facebook", label: "Facebook", color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", color: "bg-pink-600" },
];

export function Referrals() {
  const { user } = useAuth();
  const referralCode = user?.referralCode || `SM-${user?._id?.slice(-6).toUpperCase() || "MEMBER"}`;
  const referralLink = `https://socketmoniee.com/ref/${referralCode}`;

  const { data: statsData, isLoading: loadingStats } = useAsync(getReferralStats, []);
  const { data: activityData, isLoading: loadingActivity } = useAsync(getReferralActivity, []);

  const stats = statsData?.stats || statsData || { totalReferrals: 0, pointsEarned: 0, rank: "" };
  const activities = activityData?.items || activityData || [];

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  }

  function handleShare(platform) {
    const url = encodeURIComponent(referralLink);
    const text = encodeURIComponent(`Join Socket Moni using my referral code ${referralCode}!`);
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      instagram: `https://www.instagram.com/`,
    };
    if (platform === "instagram") {
      toast.info("Open Instagram and share your referral link in your bio or stories.");
      return;
    }
    window.open(shareUrls[platform], "_blank");
  }

  return (
    <div>
      <TopHeader title="Refer a Friend" showBack />
      <div className="px-5 pb-8 space-y-5">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-brand-600" />
            <h2 className="text-sm font-bold text-text-primary">Generate Referral Code</h2>
          </div>
          <div className="rounded-control bg-brand-50 p-3 text-center font-mono text-base font-bold text-brand-600">
            {referralCode}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">Generate your link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 rounded-control border border-border px-3 py-2 text-xs bg-surface-alt text-text-secondary"
              />
              <Button size="sm" icon={Copy} onClick={handleCopy}>Copy</Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-xs text-text-muted">Total Referrals</p>
            <p className="text-lg font-bold text-text-primary">{stats.totalReferrals || 0}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-text-muted">Points Earned</p>
            <p className="text-lg font-bold text-brand-600">{stats.pointsEarned || 0}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-text-muted">Rank</p>
            <p className="text-lg font-bold text-text-primary">{stats.rank || "N/A"}</p>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-text-primary mb-3">Share via</h3>
          <div className="flex gap-3">
            {SHARE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleShare(option.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-control text-white ${option.color}`}
              >
                <Share2 className="size-4" />
                <span className="text-[10px] font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-text-primary mb-3">How Referrals Work</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">You Invite</p>
                <p className="text-xs text-text-muted">Share your code or link with a friend.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">They Sign Up</p>
                <p className="text-xs text-text-muted">Your friends joins Socket Moni using your code or link.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">You Earn Points</p>
                <p className="text-xs text-text-muted">You get rewarded with points that boost your Socket Score.</p>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-sm font-bold text-text-primary mb-3">Referral Activity</h3>
          {loadingActivity ? (
            <LoadingState rows={2} />
          ) : activities.length === 0 ? (
            <EmptyState title="No referrals yet" description="Start inviting friends to earn rewards." />
          ) : (
            <div className="space-y-2">
              {activities.map((ref, idx) => (
                <Card key={idx} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{ref.name}</p>
                    <p className="text-xs text-text-muted">{ref.date}</p>
                  </div>
                  <Badge variant={ref.status === "active" ? "success" : "warning"}>
                    {ref.status === "active" ? "Active" : "Pending"}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}