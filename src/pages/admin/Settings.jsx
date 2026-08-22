import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAsync } from "@/hooks/useAsync";
import { getSystemSettings, updateSystemSettings } from "@/services/adminService";

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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary">System Settings</h1>
      <p className="text-sm text-text-secondary mt-1">Update loan tiers, interest rates, and policies.</p>
      <p className="text-xs text-amber-600 mt-1">Changes will broadcast to all members.</p>

      <div className="mt-6 space-y-6">
        {/* Loan Tiers */}
        <Card className="p-4">
          <h2 className="text-sm font-bold text-text-primary">Loan Tiers (% of Net Savings)</h2>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <label className="text-xs text-text-muted">First Loan</label>
              <Input
                type="number"
                step="0.01"
                value={settings.loanTiers.firstLoan}
                onChange={(e) => handleChange('loanTiers', 'firstLoan', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">Second Loan</label>
              <Input
                type="number"
                step="0.01"
                value={settings.loanTiers.secondLoan}
                onChange={(e) => handleChange('loanTiers', 'secondLoan', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">Third+ Loan</label>
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
          <h2 className="text-sm font-bold text-text-primary">Interest Rates by Tier</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
              <div key={tier}>
                <label className="text-xs text-text-muted capitalize">{tier}</label>
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
          <h2 className="text-sm font-bold text-text-primary">Eligibility Requirements</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-text-muted">Min Savings (₦)</label>
              <Input
                type="number"
                value={settings.eligibility.minSavings}
                onChange={(e) => handleChange('eligibility', 'minSavings', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">Min Months</label>
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
          <h2 className="text-sm font-bold text-text-primary">Fees & Penalties</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-text-muted">Withdrawal Fee (₦)</label>
              <Input
                type="number"
                value={settings.withdrawalFee}
                onChange={(e) => setSettings({ ...settings, withdrawalFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">Late Penalty Rate (%)</label>
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
    </div>
  );
}