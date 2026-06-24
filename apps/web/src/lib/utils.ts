import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "text-emerald-400",
    ONLINE: "text-emerald-400",
    OFFLINE: "text-gray-400",
    IN_RIDE: "text-blue-400",
    PENDING: "text-amber-400",
    APPROVED: "text-emerald-400",
    REJECTED: "text-red-400",
    SUSPENDED: "text-red-400",
    REQUESTED: "text-blue-400",
    MATCHING: "text-purple-400",
    DRIVER_ASSIGNED: "text-cyan-400",
    STARTED: "text-green-400",
    COMPLETED: "text-emerald-400",
    CANCELLED: "text-red-400",
    AUTHORIZED: "text-blue-400",
    CAPTURED: "text-emerald-400",
    FAILED: "text-red-400",
    REFUNDED: "text-orange-400",
  };
  return map[status] ?? "text-gray-400";
}
