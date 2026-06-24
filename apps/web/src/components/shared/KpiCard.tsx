import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
}

export function KpiCard({ label, value, change, changeLabel, trend = "neutral", icon, accent = "emerald", className }: KpiCardProps) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-gray-400";

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80 p-6 transition-all hover:border-gray-700", className)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        {icon && (
          <div className={cn("p-2 rounded-xl border", accentMap[accent] ?? accentMap.emerald)}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-black text-white tracking-tight mb-2">{value}</p>
      {change !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span>{change > 0 ? "+" : ""}{change}%</span>
          {changeLabel && <span className="text-gray-500 font-normal ml-1">{changeLabel}</span>}
        </div>
      )}
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 bg-white" />
    </div>
  );
}
