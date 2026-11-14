import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Save, Settings2 } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getSystemSettings, updateSystemSettings } from "@/services/adminService";
import { AdminPageShell, AdminHero } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";

const DEFAULTS = {
  loanTiers: { firstLoan: 0.7, secondLoan: 1.0, thirdLoan: 1.5 },
  interestRates: { bronze: 10, silver: 8, gold: 6, platinum: 5 },
  eligibility: { minSavings: 70000, minMonths: 6 },
  withdrawalFee: 100,
  latePenaltyRate: 2,
  referralReward: { referrerAmount: 500, referredUserAmount: 0, qualificationEvent: "membership_fee_paid" },
};

function mergeSettings(raw = {}) {
  return {
    loanTiers: { ...DEFAULTS.loanTiers, ...(raw.loanTiers || {}) },
    interestRates: { ...DEFAULTS.interestRates, ...(raw.interestRates || {}) },
    eligibility: { ...DEFAULTS.eligibility, ...(raw.eligibility || {}) },
    withdrawalFee: raw.withdrawalFee ?? DEFAULTS.withdrawalFee,
    latePenaltyRate: raw.latePenaltyRate ?? DEFAULTS.latePenaltyRate,
    referralReward: { ...DEFAULTS.referralReward, ...(raw.referralReward || {}) },
  };
}

export function AdminSettings() {
  const { data, isLoading, error, refetch } = useAsync(getSystemSettings, []);
  const [settings, setSettings] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const loadedSettings = useMemo(() => data?.settings || data?.data?.settings || data?.data || null, [data]);

  useEffect(() => {
    if (loadedSettings && typeof loadedSettings === "object") {
      setSettings(mergeSettings(loadedSettings));
    }
  }, [loadedSettings]);

  const updateNested = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        loanTiers: {
          firstLoan: Number(settings.loanTiers.firstLoan),
          secondLoan: Number(settings.loanTiers.secondLoan),
          thirdLoan: Number(settings.loanTiers.thirdLoan),
        },
        interestRates: {
          bronze: Number(settings.interestRates.bronze),
          silver: Number(settings.interestRates.silver),
          gold: Number(settings.interestRates.gold),
          platinum: Number(settings.interestRates.platinum),
        },
        eligibility: {
          minSavings: Number(settings.eligibility.minSavings),
          minMonths: Number(settings.eligibility.minMonths),
        },
        withdrawalFee: Number(settings.withdrawalFee),
        latePenaltyRate: Number(settings.latePenaltyRate),
        referralReward: {
          referrerAmount: Number(settings.referralReward.referrerAmount),
          referredUserAmount: Number(settings.referralReward.referredUserAmount),
          qualificationEvent: settings.referralReward.qualificationEvent,
        },
      };
      const res = await updateSystemSettings(payload);
      const next = res?.settings || res?.data?.settings;
      if (next) setSettings(mergeSettings(next));
      toast.success(res?.message || "Settings updated successfully.");
      await refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell>
      <AdminHero
        icon={Settings2}
        eyebrow="Platform Configuration"
        title="System Settings"
        description="Manage live cooperative policy parameters. Updates are saved through the admin settings API."
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          title="Could not load settings"
          description={error?.data?.message || error?.message || "System settings are unavailable right now."}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-4">
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Loan tier multipliers</h2>
            <p className="mt-1 text-xs text-text-secondary">Configure loan eligibility multipliers relative to member savings/net position as defined by backend policy.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input label="First loan" type="number" step="0.01" value={settings.loanTiers.firstLoan} onChange={(e) => updateNested("loanTiers", "firstLoan", e.target.value)} />
              <Input label="Second loan" type="number" step="0.01" value={settings.loanTiers.secondLoan} onChange={(e) => updateNested("loanTiers", "secondLoan", e.target.value)} />
              <Input label="Third+ loan" type="number" step="0.01" value={settings.loanTiers.thirdLoan} onChange={(e) => updateNested("loanTiers", "thirdLoan", e.target.value)} />
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Interest rates by tier (%)</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["bronze", "silver", "gold", "platinum"].map((tier) => (
                <Input key={tier} label={tier.charAt(0).toUpperCase() + tier.slice(1)} type="number" step="0.1" value={settings.interestRates[tier]} onChange={(e) => updateNested("interestRates", tier, e.target.value)} />
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Eligibility requirements</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Minimum savings (NGN)" type="number" value={settings.eligibility.minSavings} onChange={(e) => updateNested("eligibility", "minSavings", e.target.value)} />
              <Input label="Minimum membership months" type="number" value={settings.eligibility.minMonths} onChange={(e) => updateNested("eligibility", "minMonths", e.target.value)} />
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Fees & penalties</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Withdrawal fee (NGN)" type="number" value={settings.withdrawalFee} onChange={(e) => setSettings((p) => ({ ...p, withdrawalFee: e.target.value }))} />
              <Input label="Late penalty rate (%)" type="number" step="0.1" value={settings.latePenaltyRate} onChange={(e) => setSettings((p) => ({ ...p, latePenaltyRate: e.target.value }))} />
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Referral rewards</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Referrer reward (NGN)" type="number" value={settings.referralReward.referrerAmount} onChange={(e) => updateNested("referralReward", "referrerAmount", e.target.value)} />
              <Input label="Referred user reward (NGN)" type="number" value={settings.referralReward.referredUserAmount} onChange={(e) => updateNested("referralReward", "referredUserAmount", e.target.value)} />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Qualification event</label>
                <select
                  className="h-12 w-full rounded-control border border-border bg-card px-4 text-[15px] text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  value={settings.referralReward.qualificationEvent}
                  onChange={(e) => updateNested("referralReward", "qualificationEvent", e.target.value)}
                >
                  <option value="membership_fee_paid">Membership fee paid</option>
                  <option value="first_deposit">First deposit</option>
                  <option value="kyc_approved">KYC approved</option>
                </select>
                <p className="mt-1.5 text-xs text-text-secondary">Choose when a referral qualifies for reward processing, based on backend-supported events.</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={refetch} className="rounded-xl sm:w-auto">Reset from server</Button>
            <Button icon={Save} onClick={handleSave} isLoading={saving} className="rounded-xl sm:w-auto">
              Save settings
            </Button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

export default AdminSettings;
