"use client";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusChip } from "@/components/shared/StatusChip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { api, type RideDoc } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function RideCard({ r }: { r: RideDoc }) {
  return (
    <div className="w-full text-left p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">
            {new Date(r.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <p className="text-sm font-semibold text-white mt-0.5 capitalize">{r.vehicleClass} ride</p>
        </div>
        <div className="text-right">
          <p className="font-black text-white">{r.fareCents ? formatCurrency(r.fareCents) : "—"}</p>
          <StatusChip status={r.status} className="mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {r.pickup.lat.toFixed(4)}, {r.pickup.lng.toFixed(4)}
        </div>
        <span>→</span>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {r.dropoff.lat.toFixed(4)}, {r.dropoff.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
}

export default function RideHistoryPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["myRides"],
    queryFn: () => api.getMyRides(user!.accessToken, 1, 50),
    enabled: !!user,
  });

  const rides = data?.rides ?? [];
  const completed = rides.filter((r) => r.status === "COMPLETED");
  const cancelled = rides.filter((r) => r.status === "CANCELLED");
  const totalSpend = completed.reduce((s, r) => s + (r.fareCents ?? 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-900 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in space-y-4">
      <PageHeader title="Ride History" subtitle={`${rides.length} rides · ${formatCurrency(totalSpend)} spent`} />

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Total Rides", value: rides.length },
          { label: "Completed", value: completed.length },
          { label: "Total Spend", value: formatCurrency(totalSpend) },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-2xl border border-gray-800 bg-gray-900/50">
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {rides.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🚗</p>
          <p className="text-gray-400 font-medium">No rides yet</p>
          <p className="text-sm text-gray-600 mt-1">Your ride history will appear here</p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All ({rides.length})</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-2 mt-3">
            {rides.map((r) => <RideCard key={r._id} r={r} />)}
          </TabsContent>
          <TabsContent value="completed" className="space-y-2 mt-3">
            {completed.length === 0
              ? <p className="text-center text-gray-500 py-8">No completed rides</p>
              : completed.map((r) => <RideCard key={r._id} r={r} />)}
          </TabsContent>
          <TabsContent value="cancelled" className="space-y-2 mt-3">
            {cancelled.length === 0
              ? <p className="text-center text-gray-500 py-8">No cancelled rides</p>
              : cancelled.map((r) => <RideCard key={r._id} r={r} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
