import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAsync } from "@/hooks/useAsync";
import { apiClient } from "@/services/apiClient";
import { cn } from "@/utils/cn";

const LABEL = {
  savings_consistency: "Savings Consistency",
  savings_growth: "Savings Growth",
  loan_repayment: "Loan Repayment",
  withdrawal_behaviour: "Withdrawal Behaviour",
  profile_completion: "Profile Completion",
  community_trust: "Community Trust",
};

export function SocketScoreConfig() {
  const getConfig = () => apiClient.get("/admin/score/config");
  const getHistory = () => apiClient.get("/admin/score/config/history");

  const { data: configRes, isLoading, refetch } = useAsync(getConfig, []);
  const { data: historyRes } = useAsync(getHistory, []);

  const config = configRes?.data || configRes;
  const history = historyRes?.data || historyRes || [];

  const [components, setComponents] = useState([]);
  const [changeNotes, setChangeNotes] = useState("");
  const [memberId, setMemberId] = useState("");
  const [monthInput, setMonthInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (config?.components) {
      setComponents(
        config.components.map((c) => ({
          code: c.code,
          name: c.name || LABEL[c.code] || c.code,
          weight: c.weight,
          calculationRule: c.calculationRule,
          formulaStatus: c.formulaStatus,
          description: c.description || "",
          isActive: c.isActive !== false,
        }))
      );
    }
  }, [config]);

  const total = components.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  const totalOk = Math.abs(total - 100) < 0.001;

  function setWeight(code, value) {
    setComponents((prev) => prev.map((c) => (c.code === code ? { ...c, weight: value } : c)));
  }

  async function handleSave() {
    if (!totalOk) {
      toast.error("Total weight must equal exactly 100 before saving.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put("/admin/score/config", {
        components: components.map((c) => ({ ...c, weight: Number(c.weight) })),
        changeNotes: changeNotes || "Admin weight update",
      });
      toast.success("Scoring configuration saved (new version).");
      setChangeNotes("");
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || e?.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalculate() {
    if (!memberId.trim()) {
      toast.error("Enter a member ID.");
      return;
    }
    const [year, month] = monthInput.split("-").map(Number);
    setRecalculating(true);
    try {
      await apiClient.post(`/admin/score/members/${memberId.trim()}/recalculate`, {
        year: year || undefined,
        month: month || undefined,
        force: true,
        reason: "admin recalculation",
      });
      toast.success("Member score recalculated.");
    } catch (e) {
      toast.error(e?.data?.message || e?.message || "Recalculation failed.");
    } finally {
      setRecalculating(false);
    }
  }

  if (isLoading) return <div className="p-6 text-center">Loading scoring configuration...</div>;

  return (
    <div className="mx-auto mt-4 w-full max-w-3xl p-5 pb-24">
      <TopHeader variant="brand" />
      <h1 className="text-xl font-bold text-[#090f24]">SocketScore Configuration</h1>
      <p className="mt-1 text-sm text-gray-500">
        Active version: <strong>v{config?.version}</strong>. Changes create a new version — previous monthly
        scores keep their original configuration version and are only rewritten by an authorised recalculation.
      </p>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-bold">Six components (weights must total 100)</h2>
        <div className="mt-3 space-y-3">
          {components.map((c) => (
            <div key={c.code} className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center">
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-[11px] text-gray-500">{c.description}</p>
                <p className="text-[10px] text-gray-400">Rule: {c.calculationRule} · {c.formulaStatus}</p>
              </div>
              <Input
                label="Weight"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={c.weight}
                onChange={(e) => setWeight(c.code, e.target.value)}
              />
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={c.isActive}
                  onChange={(e) =>
                    setComponents((prev) => prev.map((x) => (x.code === c.code ? { ...x, isActive: e.target.checked } : x)))
                  }
                />
                Active
              </label>
            </div>
          ))}
        </div>
        <p className={cn("mt-3 text-sm font-bold", totalOk ? "text-emerald-600" : "text-rose-600")}>
          Total: {Number(total).toFixed(1)} / 100 {totalOk ? "✓ ready to save" : "(must equal 100)"}
        </p>
        <Input
          label="Change notes"
          placeholder="e.g. Monthly review — growth weight up"
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
        />
        <Button fullWidth disabled={!totalOk || saving || components.length !== 6} isLoading={saving} onClick={handleSave} className="mt-3 rounded-full">
          Save new version
        </Button>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-bold">Member score recalculation (audited)</h2>
        <p className="mt-1 text-[11px] text-gray-500">
          Re-runs the calculation for one member/month against verified data and recomputes their cumulative chain.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input label="Member ID" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Member ObjectId" />
          <Input label="Month (YYYY-MM)" type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
        </div>
        <Button fullWidth disabled={recalculating} isLoading={recalculating} onClick={handleRecalculate} className="mt-3 rounded-full">
          Recalculate member score
        </Button>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-bold">Configuration history</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">No previous versions yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {history.map((h) => (
              <div key={h._id || h.version} className="rounded-xl bg-[#F8FAFC] p-3 text-xs">
                <p className="font-bold">v{h.version} {h.isActive ? "· active" : ""}</p>
                <p className="text-gray-500">{h.changeNotes} · {new Date(h.createdAt).toLocaleString()}</p>
                <p className="text-gray-500">{(h.components || []).map((c) => `${c.code}:${c.weight}`).join(" | ")}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default SocketScoreConfig;
