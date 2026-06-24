"use client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Map, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

const CHART_STYLE = { background: "#111827", border: "1px solid #374151", borderRadius: 12, color: "#fff" };

export default function AnalyticsPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["summary"],
    queryFn: api.getSummary,
    refetchInterval: 30_000,
  });

  const { data: timeSeries, isLoading: tsLoading } = useQuery({
    queryKey: ["timeseries"],
    queryFn: api.getTimeSeries,
    refetchInterval: 60_000,
  });

  const daily = (timeSeries?.daily ?? []).map((d) => ({ label: d._id.slice(5), revenue: d.revenue / 100, rides: d.rides }));
  const weekly = (timeSeries?.weekly ?? []).map((d) => ({ label: d._id.slice(5), revenue: d.revenue / 100, rides: d.rides }));

  const avgFare = summary && summary.completedRides > 0
    ? Math.floor(summary.revenueCents / summary.completedRides)
    : 0;

  if (summaryLoading || tsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Analytics" subtitle="Platform-wide metrics and trends" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Completed Rides" value={(summary?.completedRides ?? 0).toLocaleString()} icon={<Map className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Total Revenue"   value={summary ? formatCurrency(summary.revenueCents) : "—"} icon={<DollarSign className="w-4 h-4" />} accent="amber" />
        <KpiCard label="Avg Fare"         value={avgFare ? formatCurrency(avgFare) : "—"} icon={<DollarSign className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Days with Data"   value={daily.length.toString()} icon={<Map className="w-4 h-4" />} accent="purple" />
      </div>

      {daily.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Revenue (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="gDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={CHART_STYLE} formatter={(v) => [formatCurrency((v as number) * 100), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#gDaily)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Daily Ride Volume (30d)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_STYLE} />
                    <Bar dataKey="rides" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Rides" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Weekly Revenue (7d)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weekly}>
                    <defs>
                      <linearGradient id="gWeek" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={CHART_STYLE} formatter={(v) => [formatCurrency((v as number) * 100), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} fill="url(#gWeek)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-400 font-medium">No analytics data yet</p>
            <p className="text-sm text-gray-600 mt-1">Charts will appear after rides are completed</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
