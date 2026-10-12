import { useState, useEffect } from "react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAsync } from "@/hooks/useAsync";
import { getSystemSettings, updateSystemSettings } from "@/services/adminService";
import { formatNaira } from "@/utils/format";

export function AdminSettings() {
  const { data, isLoading, refetch } = useAsync(getSystemSettings, []);
  const [settings, setSettings] = useState({
    loanTiers: { firstLoan: 0.7, secondLoan: 1.0, thirdLoan: 1.5 },
    interestRates: { bronze: 10, silver: 8, gold: 6, platinum: 5 },
    eligibility: { minSavings: 70000, minMonths: 6 },
    withdrawalFee: 100,
    latePenaltyRate: 2,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  const handleChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: parseFloat(value) || value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      toast.success("Settings updated successfully!");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading settings...</div>;

  return (
    <div className="mx-auto mt-4 w-full max-w-7xl p-6 space-y-6">
      <TopHeader variant="brand" />

      <h1 className="text-xl font-bold text-[#090f24]">System Settings</h1>
      <p className="text-sm text-gray-500 mt-1">Update loan tiers, interest rates, and policies.</p>
      <p className="text-xs text-amber-600 mt-1">Changes will broadcast to all members.</p>

      {/* Loan Tiers */}
      <Card className="p-4">
        <h2 className="text-sm font-bold text-[#090f24]">Loan Tiers (% of Net Savings)</h2>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="text-xs text-gray-500">First Loan</label>
            <Input
              type="number"
              step="0.01"
              value={settings.loanTiers.firstLoan}
              onChange={(e) => handleChange('loanTiers', 'firstLoan', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Second Loan</label>
            <Input
              type="number"
              step="0.01"
              value={settings.loanTiers.secondLoan}
              onChange={(e) => handleChange('loanTiers', 'secondLoan', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Third+ Loan</label>
            <Input
              type="number"
              step="0.01"
              value={settings.loanTiers.thirdLoan}
              onChange={(e) => handleChange('loanTiers', 'thirdLoan', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Interest Rates */}
      <Card className="p-4">
        <h2 className="text-sm font-bold text-[#090f24]">Interest Rates by Tier</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
            <div key={tier}>
              <label className="text-xs text-gray-500 capitalize">{tier}</label>
              <Input
                type="number"
                step="0.1"
                value={settings.interestRates[tier]}
                onChange={(e) => handleChange('interestRates', tier, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Eligibility */}
      <Card className="p-4">
        <h2 className="text-sm font-bold text-[#090f24]">Eligibility Requirements</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs text-gray-500">Min Savings (₦)</label>
            <Input
              type="number"
              value={settings.eligibility.minSavings}
              onChange={(e) => handleChange('eligibility', 'minSavings', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Min Months</label>
            <Input
              type="number"
              value={settings.eligibility.minMonths}
              onChange={(e) => handleChange('eligibility', 'minMonths', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Fees */}
      <Card className="p-4">
        <h2 className="text-sm font-bold text-[#090f24]">Fees & Penalties</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs text-gray-500">Withdrawal Fee (₦)</label>
            <Input
              type="number"
              value={settings.withdrawalFee}
              onChange={(e) => setSettings({ ...settings, withdrawalFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Late Penalty Rate (%)</label>
            <Input
              type="number"
              step="0.1"
              value={settings.latePenaltyRate}
              onChange={(e) => setSettings({ ...settings, latePenaltyRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </Card>

      <Button fullWidth icon={Save} isLoading={saving} onClick={handleSave}>
        Save Settings
      </Button>
    </div>
  );
}