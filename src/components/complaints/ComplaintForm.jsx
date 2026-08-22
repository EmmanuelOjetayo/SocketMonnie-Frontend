import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { submitComplaint } from "@/services/complaints";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical Issue" },
  { value: "payment", label: "Payment Issue" },
  { value: "loan", label: "Loan Issue" },
  { value: "savings", label: "Savings Issue" },
  { value: "account", label: "Account Issue" },
  { value: "other", label: "Other" },
];

export function ComplaintForm({ onSuccess }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitComplaint({ subject, category, message });
      toast.success("Complaint submitted successfully!");
      setSubject("");
      setCategory("general");
      setMessage("");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Subject"
        placeholder="Brief summary of your issue"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />
      
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-control border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue in detail..."
          rows={5}
          className="w-full rounded-control border border-border bg-card px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
          required
        />
      </div>
      
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Submit Complaint
      </Button>
    </form>
  );
}