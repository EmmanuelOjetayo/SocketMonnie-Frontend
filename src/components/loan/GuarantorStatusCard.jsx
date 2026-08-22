import { useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, statusToBadgeProps } from "@/components/ui/Badge";
import { useAsync } from "@/hooks/useAsync";
import { getGuarantorByLoan, requestGuarantor } from "@/services/guarantor";

const RELATIONSHIPS = ["Spouse", "Sibling", "Parent", "Friend", "Colleague", "Other"];

export function GuarantorStatusCard({ loanId }) {
  const { data, isLoading, refetch } = useAsync(() => getGuarantorByLoan(loanId), [loanId]);
  const guarantor = data?.data;

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    guarantorName: "",
    guarantorEmail: "",
    guarantorPhone: "",
    relationship: RELATIONSHIPS[0],
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.guarantorName || !form.guarantorEmail || !form.guarantorPhone) {
      toast.error("Please fill in all guarantor details.");
      return;
    }
    setIsSubmitting(true);
    try {
      await requestGuarantor({ loanId, ...form });
      toast.success("Guarantor invitation sent!");
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Could not send guarantor request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="rounded-card border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-brand-600" />
        <h3 className="text-sm font-bold text-text-primary">Guarantor</h3>
      </div>

      {guarantor ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">{guarantor.guarantorName}</span>
            <Badge {...statusToBadgeProps(guarantor.status)} />
          </div>
          <p className="text-xs text-text-muted">{guarantor.guarantorEmail}</p>
          {guarantor.status === "rejected" && guarantor.rejectionReason && (
            <p className="text-xs text-danger-600">Reason: {guarantor.rejectionReason}</p>
          )}
          {guarantor.status === "pending" && (
            <p className="text-xs text-text-muted">
              Awaiting response — invitation expires {new Date(guarantor.expiresAt).toLocaleDateString()}.
            </p>
          )}
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Guarantor's Full Name"
            value={form.guarantorName}
            onChange={(e) => updateField("guarantorName", e.target.value)}
          />
          <Input
            label="Guarantor's Email"
            type="email"
            value={form.guarantorEmail}
            onChange={(e) => updateField("guarantorEmail", e.target.value)}
          />
          <Input
            label="Guarantor's Phone"
            value={form.guarantorPhone}
            onChange={(e) => updateField("guarantorPhone", e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Relationship</label>
            <select
              value={form.relationship}
              onChange={(e) => updateField("relationship", e.target.value)}
              className="h-12 w-full rounded-control border border-border bg-card px-4 text-[15px] text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" fullWidth isLoading={isSubmitting} icon={Send}>
              Send Invite
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-sm text-text-muted">
            No guarantor has been added for this loan yet.
          </p>
          <Button variant="secondary" fullWidth onClick={() => setShowForm(true)}>
            Add a Guarantor
          </Button>
        </>
      )}
    </div>
  );
}
