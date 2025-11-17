import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "checking" | "active" | "non-wa" | "error";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    pending: {
      label: "PENDING",
      variant: "secondary" as const,
      icon: null,
      ariaLabel: "Status: Pending",
    },
    checking: {
      label: "CHECKING",
      variant: "secondary" as const,
      icon: <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />,
      ariaLabel: "Status: Checking in progress",
    },
    active: {
      label: "AKTIF",
      variant: "default" as const,
      icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
      ariaLabel: "Status: Active on WhatsApp",
    },
    "non-wa": {
      label: "NON-WA",
      variant: "outline" as const,
      icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
      ariaLabel: "Status: Not registered on WhatsApp",
    },
    error: {
      label: "ERROR",
      variant: "destructive" as const,
      icon: <AlertCircle className="w-3 h-3" aria-hidden="true" />,
      ariaLabel: "Status: Error occurred during check",
    },
  };

  const config = configs[status];

  return (
    <Badge 
      variant={config.variant}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide"
      data-testid={`badge-status-${status}`}
      aria-label={config.ariaLabel}
      role="status"
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
