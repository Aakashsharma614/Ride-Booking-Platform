"use client";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function EarningsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["driverEarnings", user?.id],
    queryFn: () => api.getDriverEarnings(user!.id, user!.accessToken),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const totalCents = data?.totalCents ?? 0;
  const trips = data?.trips ?? 0;
  const daily = (data?.daily ?? []).map((d) => ({ day: d._id, earnings: d.earningsCents / 100, trips: d.rides }));
  const recent = data?.recent ?? [];

  const avgPerTrip = trips > 0 ? Math.floor(totalCents / trips) : 0;

  return (
    <div className="p-4 animate-fade-in space-y-5">
      <PageHeader title="Earnings" />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total Earnings" value={formatCurrency(totalCents)} accent="blue" />
        <KpiCard label="Total Trips" value={trips.toString()} accent="emerald" />
        <KpiCard label="Avg/Trip" value={formatCurrency(avgPerTrip)} accent="amber" />
        <KpiCard label="Period" value="30 days" accent="purple" />
      </div>

      {daily.length > 0 ? (
        <Tabs defaultValue="daily">
          <TabsList className="w-full">
            <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
              <p className="text-xs text-gray-500 mb-3">Earnings (last 30 days)</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="earnings" stroke="#3B82F6" fill="url(#blueGrad)" strokeWidth={2} dot={{ fill: "#3B82F6", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-8 rounded-2xl border border-gray-800 bg-gray-900/50">
          <p className="text-gray-500 text-sm">No earnings data yet</p>
          <p className="text-xs text-gray-600 mt-1">Complete rides to see earnings charts</p>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Trips</h3>
          <div className="space-y-2">
            {recent.map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">
                    {new Date(t.occurredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-gray-400 truncate">Ride #{t.rideId.slice(-6)}</p>
                </div>
                <span className="font-black text-white text-sm">{formatCurrency(t.amountCents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length === 0 && daily.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-400 font-medium">No earnings yet</p>
          <p className="text-sm text-gray-600 mt-1">Go online and complete rides to start earning</p>
        </div>
      )}
    </div>
  );
}
