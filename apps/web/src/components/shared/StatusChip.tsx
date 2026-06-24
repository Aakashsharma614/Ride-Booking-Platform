import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  ACTIVE:           { label: "Active",           dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  ONLINE:           { label: "Online",           dot: "bg-emerald-400 animate-pulse", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  OFFLINE:          { label: "Offline",          dot: "bg-gray-500",    badge: "bg-gray-800 text-gray-400 border-gray-700" },
  IN_RIDE:          { label: "In Ride",          dot: "bg-blue-400",    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  PENDING:          { label: "Pending",          dot: "bg-amber-400",   badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  APPROVED:         { label: "Approved",         dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  REJECTED:         { label: "Rejected",         dot: "bg-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  SUSPENDED:        { label: "Suspended",        dot: "bg-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  REQUESTED:        { label: "Requested",        dot: "bg-blue-400",    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  MATCHING:         { label: "Matching",         dot: "bg-purple-400 animate-pulse", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  DRIVER_ASSIGNED:  { label: "Driver Assigned",  dot: "bg-cyan-400",    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  DRIVER_ARRIVED:   { label: "Driver Arrived",   dot: "bg-cyan-400",    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  STARTED:          { label: "In Progress",      dot: "bg-green-400 animate-pulse", badge: "bg-green-500/10 text-green-400 border-green-500/30" },
  COMPLETED:        { label: "Completed",        dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  CANCELLED:        { label: "Cancelled",        dot: "bg-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  AUTHORIZED:       { label: "Authorized",       dot: "bg-blue-400",    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  CAPTURED:         { label: "Captured",         dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  FAILED:           { label: "Failed",           dot: "bg-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  REFUNDED:         { label: "Refunded",         dot: "bg-orange-400",  badge: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  healthy:          { label: "Healthy",          dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  degraded:         { label: "Degraded",         dot: "bg-amber-400 animate-pulse", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  down:             { label: "Down",             dot: "bg-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/30" },
};

interface StatusChipProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

export function StatusChip({ status, showDot = true, className }: StatusChipProps) {
  const config = statusConfig[status] ?? { label: status, dot: "bg-gray-400", badge: "bg-gray-800 text-gray-400 border-gray-700" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.badge, className)}>
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", config.dot)} />}
      {config.label}
    </span>
  );
}
