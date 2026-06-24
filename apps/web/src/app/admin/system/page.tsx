"use client";
import { useQuery } from "@tanstack/react-query";
import { Zap, Activity, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusChip } from "@/components/shared/StatusChip";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

function latencyColor(ms: number) {
  if (ms < 50) return "text-emerald-400";
  if (ms < 150) return "text-amber-400";
  return "text-red-400";
}

function latencyBarColor(ms: number) {
  if (ms < 50) return "bg-emerald-500";
  if (ms < 150) return "bg-amber-500";
  return "bg-red-500";
}

export default function SystemHealthPage() {
  const user = useAuthStore((s) => s.user);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: () => api.getSystemHealth(user!.accessToken),
    enabled: !!user,
    refetchInterval: 15_000,
  });

  const healthy  = services.filter((s) => s.status === "healthy").length;
  const degraded = services.filter((s) => s.status === "degraded").length;
  const down     = services.filter((s) => s.status === "down").length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Auto-refreshing every 15s"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Monitoring
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Services Up"  value={`${healthy}/${services.length}`} icon={<CheckCircle className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Degraded"     value={degraded}                          icon={<AlertTriangle className="w-4 h-4" />} accent="amber" />
        <KpiCard label="Down"         value={down}                              icon={<Zap className="w-4 h-4" />}         accent="red" />
        <KpiCard label="Monitored"    value={services.length}                   icon={<Activity className="w-4 h-4" />}    accent="blue" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-gray-400">Could not reach health endpoint</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Microservices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((s) => (
              <Card key={s.name} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                  </div>
                  <StatusChip status={s.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <p className="text-gray-500 mb-0.5">Latency</p>
                    <p className={`font-bold ${latencyColor(s.latencyMs)}`}>{s.latencyMs.toFixed(0)}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Status</p>
                    <p className={`font-bold ${s.status === "healthy" ? "text-emerald-400" : s.status === "degraded" ? "text-amber-400" : "text-red-400"}`}>
                      {s.status}
                    </p>
                  </div>
                </div>
                <Progress value={Math.min(100, (s.latencyMs / 200) * 100)} indicatorClassName={latencyBarColor(s.latencyMs)} className="h-1" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
