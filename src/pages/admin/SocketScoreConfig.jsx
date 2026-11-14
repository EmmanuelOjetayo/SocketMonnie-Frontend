import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Award, RefreshCw, Save } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { apiClient } from "@/services/apiClient";
import { formatDate } from "@/utils/format";
import { AdminPageShell, AdminHero } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";

function clampWeight(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function SocketScoreConfig() {
  const getConfig = () => apiClient.get("/admin/score/config");
  const getHistory = () => apiClient.get("/admin/score/config/history");

  const configQuery = useAsync(getConfig, []);
  const historyQuery = useAsync(getHistory, []);

  const config = configQuery.data?.data || configQuery.data || null;
  const history = Array.isArray(historyQuery.data?.data) ? historyQuery.data.data : Array.isArray(historyQuery.data) ? historyQuery.data : [];

  const [components, setComponents] = useState([]);
  const [changeNotes, setChangeNotes] = useState("");
  const [memberId, setMemberId] = useState("");
  const [monthInput, setMonthInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (Array.isArray(config?.components)) {
      setComponents(
        config.components.map((c) => ({
          code: c.code,
          name: c.name || c.code,
          weight: Number(c.weight ?? 0),
          description: c.description || "",
          calculationRule: c.calculationRule || "",
          formulaStatus: c.formulaStatus || "",
          isActive: c.isActive !== false,
        }))
      );
    }
  }, [config]);

  const total = useMemo(() => components.reduce((sum, c) => sum + Number(c.weight || 0), 0), [components]);
  const totalOk = Math.abs(total - 100) < 0.001;

  const updateWeight = (code, value) => {
    setComponents((prev) => prev.map((c) => (c.code === code ? { ...c, weight: value } : c)));
  };

  const saveConfig = async () => {
    if (!Array.isArray(components) || components.length === 0) {
      toast.error("No scoring components loaded.");
      return;
    }
    if (!totalOk) {
      toast.error("Component weights must total exactly 100.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put("/admin/score/config", {
        components: components.map((c) => ({ ...c, weight: clampWeight(c.weight) })),
        changeNotes: changeNotes.trim() || "Admin scoring configuration update",
      });
      toast.success("Scoring configuration saved.");
      setChangeNotes("");
      await Promise.all([configQuery.refetch(), historyQuery.refetch()]);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save scoring configuration.");
    } finally {
      setSaving(false);
    }
  };

  const recalculate = async () => {
    const id = memberId.trim();
    if (!id) {
      toast.error("Enter a member ID.");
      return;
    }
    const [yearStr, monthStr] = monthInput ? monthInput.split("-") : [];
    const year = yearStr ? Number(yearStr) : undefined;
    const month = monthStr ? Number(monthStr) : undefined;
    setRecalculating(true);
    try {
      await apiClient.post(`/admin/score/members/${id}/recalculate`, {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        force: true,
        reason: "admin recalculation",
      });
      toast.success("Member score recalculated.");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to recalculate member score.");
    } finally {
      setRecalculating(false);
    }
  };

  const loading = configQuery.isLoading || historyQuery.isLoading;
  const loadError = configQuery.error || historyQuery.error;

  return (
    <AdminPageShell>
      <AdminHero
        icon={Award}
        eyebrow="SocketScore Governance"
        title="SocketScore Configuration"
        description="Manage versioned scoring weights and trigger audited recalculations using live backend score services."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => { configQuery.refetch(); historyQuery.refetch(); }} className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
            Refresh
          </Button>
        }
      />

      {loading ? (
        <LoadingState rows={5} />
      ) : loadError ? (
        <ErrorState
          title="Could not load SocketScore configuration"
          description={loadError?.data?.message || loadError?.message || "Scoring configuration is unavailable right now."}
          onRetry={() => { configQuery.refetch(); historyQuery.refetch(); }}
        />
      ) : (
        <div className="space-y-4">
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#090f24]">Active configuration</h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Version <span className="font-bold text-[#090f24]">v{config?.version ?? "—"}</span>. Saving creates a new version; prior monthly records retain their original configuration unless recalculated.
                </p>
              </div>
              <div className={`rounded-xl px-3 py-2 text-sm font-extrabold ${totalOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                Total: {total.toFixed(1)} / 100
              </div>
            </div>

            {components.length === 0 ? (
              <EmptyState title="No scoring components found" description="The backend did not return configurable scoring components." className="py-8" />
            ) : (
              <div className="mt-4 space-y-3">
                {components.map((c) => (
                  <div key={c.code} className="grid grid-cols-1 gap-3 rounded-xl border border-[#dee3f9] bg-[#f8faff] p-3 sm:grid-cols-12 sm:items-center">
                    <div className="sm:col-span-6">
                      <p className="text-sm font-bold text-[#090f24]">{c.name}</p>
                      {c.description ? <p className="mt-0.5 text-xs text-text-secondary">{c.description}</p> : null}
                      {(c.calculationRule || c.formulaStatus) ? (
                        <p className="mt-1 text-[11px] font-medium text-text-muted">
                          {[c.calculationRule, c.formulaStatus].filter(Boolean).join(" • ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="Weight"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={c.weight}
                        onChange={(e) => updateWeight(c.code, e.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 rounded-xl border border-[#bdc8f3]/30 bg-white px-3 py-2 text-sm font-medium text-[#090f24] sm:col-span-3">
                      <input
                        type="checkbox"
                        checked={!!c.isActive}
                        onChange={(e) => setComponents((prev) => prev.map((x) => x.code === c.code ? { ...x, isActive: e.target.checked } : x))}
                      />
                      Active
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Input label="Change notes" placeholder="Describe why this configuration is changing" value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="primary" icon={Save} onClick={saveConfig} isLoading={saving} disabled={!totalOk || components.length === 0} className="rounded-xl sm:w-auto">
                  Save new version
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Member score recalculation</h2>
            <p className="mt-1 text-xs text-text-secondary">Runs an audited recalculation for a specific member and optional month against verified backend data.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Member ID" placeholder="User/Object ID" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
              <Input label="Month (optional)" type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
            </div>
            <div className="mt-3 flex sm:justify-end">
              <Button onClick={recalculate} isLoading={recalculating} disabled={!memberId.trim()} className="rounded-xl sm:w-auto">
                Recalculate member score
              </Button>
            </div>
          </Card>

          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-extrabold text-[#090f24]">Configuration history</h2>
            {history.length === 0 ? (
              <EmptyState title="No configuration history" description="No previous scoring configuration versions were returned." className="py-8" />
            ) : (
              <div className="mt-3 space-y-2.5">
                {history.map((h) => (
                  <div key={h._id || h.version} className="rounded-xl border border-[#dee3f9] bg-[#f8faff] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-[#090f24]">Version v{h.version}{h.isActive ? " • Active" : ""}</p>
                      <p className="text-xs text-text-secondary">{formatDate(h.createdAt, "MMM dd, yyyy h:mm a") || "—"}</p>
                    </div>
                    {h.changeNotes ? <p className="mt-1 text-xs text-text-secondary">{h.changeNotes}</p> : null}
                    {Array.isArray(h.components) && h.components.length ? (
                      <p className="mt-2 text-[11px] font-medium text-text-muted break-words">
                        {h.components.map((c) => `${c.code || c.name}: ${c.weight}`).join("  •  ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminPageShell>
  );
}

export default SocketScoreConfig;
