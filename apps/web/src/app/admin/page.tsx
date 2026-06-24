"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, Car, Map, DollarSign, CheckCircle, Activity } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { MapView } from "@/components/shared/MapView";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AdminOverview() {
  const user = useAuthStore((s) => s.user);

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: api.getSummary,
    refetchInterval: 15_000,
  });

  const { data: timeSeries } = useQuery({
    queryKey: ["timeseries"],
    queryFn: api.getTimeSeries,
    refetchInterval: 30_000,
  });

  const { data: ridesData } = useQuery({
    queryKey: ["adminRides"],
    queryFn: () => api.listRides(user!.accessToken, 1),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const { data: driversData } = useQuery({
    queryKey: ["adminDrivers"],
    queryFn: () => api.listDrivers(user!.accessToken, 1),
    enabled: !!user,
  });

  const { data: ridersData } = useQuery({
    queryKey: ["adminRiders"],
    queryFn: () => api.listRiders(user!.accessToken, 1),
    enabled: !!user,
  });

  const rides = ridesData?.rides ?? [];
  const activeRides = rides.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status));
  const dailyChart = (timeSeries?.daily ?? []).map((d) => ({ date: d._id.slice(5), rides: d.rides, revenue: d.revenue / 100 }));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Operations Overview"
        subtitle="Live platform metrics · Auto-refreshing"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Riders"    value={(ridersData?.total ?? 0).toLocaleString()} icon={<Users className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Total Drivers"   value={(driversData?.total ?? 0).toLocaleString()} icon={<Car className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Active Rides"    value={activeRides.length} icon={<Map className="w-4 h-4" />} accent="purple" />
        <KpiCard label="Revenue (total)" value={summary ? formatCurrency(summary.revenueCents) : "—"} icon={<DollarSign className="w-4 h-4" />} accent="amber" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Completed Rides" value={(summary?.completedRides ?? 0).toLocaleString()} icon={<CheckCircle className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Total Rides"     value={(ridesData?.total ?? 0).toLocaleString()} icon={<Map className="w-4 h-4" />} accent="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden p-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Live Operations Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-0">
            <MapView className="rounded-b-2xl" height="h-80" showSurge />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Rides</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {activeRides.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No active rides</p>
            ) : activeRides.slice(0, 8).map((r) => (
              <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-xs font-mono text-gray-400">#{r._id.slice(-6)}</p>
                  <p className="text-xs text-gray-500 capitalize">{r.vehicleClass}</p>
                </div>
                <StatusChip status={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {dailyChart.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Daily Revenue (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChart}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12, color: "#fff" }} formatter={(v) => [`$${v}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-400" /> Daily Ride Volume (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyChart} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 12, color: "#fff" }} />
                  <Bar dataKey="rides" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Rides" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {dailyChart.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No ride data yet. Charts will appear after the first completed rides.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
