import { Card } from "@/components/ui/Card";
import { Badge, statusToBadgeProps } from "@/components/ui/Badge";
import { formatDate, formatRelative } from "@/utils/format";
import { MessageSquare, Clock } from "lucide-react";

export function ComplaintCard({ complaint }) {
  const { variant, label } = statusToBadgeProps(complaint.status);
  
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <MessageSquare className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{complaint.subject}</p>
            <p className="text-xs text-text-muted">{formatDate(complaint.createdAt)}</p>
          </div>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </div>
      
      <p className="text-sm text-text-secondary line-clamp-2">{complaint.message}</p>
      
      {complaint.response && (
        <div className="mt-2 rounded-control bg-surface-alt p-3 text-xs">
          <p className="font-semibold text-text-primary">Response:</p>
          <p className="text-text-secondary mt-0.5">{complaint.response}</p>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border">
        <Clock className="size-3" />
        <span>{formatRelative(complaint.createdAt)}</span>
        {complaint.category && (
          <>
            <span className="text-border">•</span>
            <span>Category: {complaint.category}</span>
          </>
        )}
      </div>
    </Card>
  );
}