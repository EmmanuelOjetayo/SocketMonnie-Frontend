import { useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, Plus } from "lucide-react";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ComplaintCard } from "@/components/complaints/ComplaintCard";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { useAsync } from "@/hooks/useAsync";
import { getMyComplaints, submitComplaint } from "@/services/complaints";

export function Complaints() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data, isLoading, refetch } = useAsync(getMyComplaints, []);

  const complaints = data?.items || [];

  async function handleSubmitComplaint(payload) {
    setIsSubmitting(true);
    try {
      await submitComplaint(payload);
      toast.success("Complaint submitted successfully!");
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <TopHeader title="Support & Complaints" showBack />
      <div className="px-5 pb-8 space-y-5">
        <Button
          fullWidth
          icon={Plus}
          onClick={() => setIsFormOpen(true)}
        >
          Submit Complaint
        </Button>

        {isLoading ? (
          <LoadingState rows={3} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No complaints"
            description="You haven't submitted any complaints yet."
          />
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <ComplaintCard key={c.id || c._id} complaint={c} />
            ))}
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Submit a Complaint"
      >
        <ComplaintForm
          onSubmit={handleSubmitComplaint}
          isSubmitting={isSubmitting}
        />
      </BottomSheet>
    </div>
  );
}