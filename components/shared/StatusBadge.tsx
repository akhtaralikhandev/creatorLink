import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "DRAFT" | "ACTIVE" | "CLOSED"
  | "PENDING" | "ACCEPTED" | "REJECTED"
  | "ACTIVE_COLLAB" | "COMPLETED"
  | "APPROVED" | "PAID"
  | string;

const STATUS_MAP: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
  // Campaign
  DRAFT:    { label: "Draft",     variant: "outline" },
  ACTIVE:   { label: "Active",    variant: "success-muted" },
  CLOSED:   { label: "Closed",    variant: "secondary" },
  // Application
  PENDING:  { label: "Pending",   variant: "warning-muted" },
  ACCEPTED: { label: "Accepted",  variant: "success-muted" },
  REJECTED: { label: "Rejected",  variant: "destructive-muted" },
  // Collaboration
  ACTIVE_COLLAB: { label: "Active",    variant: "info-muted" },
  COMPLETED:     { label: "Completed", variant: "success-muted" },
  // Submission
  APPROVED: { label: "Approved",  variant: "success-muted" },
  // Payment
  PAID:     { label: "Paid",      variant: "success-muted" },
};

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
  /** override for ACTIVE to distinguish campaign vs collaboration */
  context?: "campaign" | "collaboration";
}

export function StatusBadge({ status, className, context }: StatusBadgeProps) {
  let key = status;
  if (status === "ACTIVE" && context === "collaboration") key = "ACTIVE_COLLAB";

  const config = STATUS_MAP[key] ?? { label: status, variant: "outline" as const };

  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {config.label}
    </Badge>
  );
}
