"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Map, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusChip } from "@/components/shared/StatusChip";
import { KpiCard } from "@/components/shared/KpiCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { api, type RideDoc } from "@/lib/api";

const columns: Column<RideDoc>[] = [
  { key: "_id",         header: "Ride ID",   render: (r) => <span className="font-mono text-xs text-gray-400">#{r._id.slice(-6)}</span> },
  { key: "riderId",     header: "Rider ID",  render: (r) => <span className="text-xs text-gray-300">{r.riderId.slice(-8)}</span> },
  { key: "driverId",    header: "Driver ID", render: (r) => <span className="text-xs text-gray-300">{r.driverId ? r.driverId.slice(-8) : <span className="text-gray-500">—</span>}</span> },
  { key: "status",      header: "Status",    render: (r) => <StatusChip status={r.status} /> },
  { key: "cityId",      header: "City",      render: (r) => <span className="uppercase text-xs font-semibold text-gray-400">{r.cityId}</span> },
  { key: "vehicleClass",header: "Class",     render: (r) => <span className="capitalize text-gray-300">{r.vehicleClass}</span> },
  { key: "fareCents",   header: "Fare",      render: (r) => r.fareCents ? <span className="text-emerald-400 font-semibold">{formatCurrency(r.fareCents)}</span> : <span className="text-gray-500">—</span> },
  { key: "createdAt",   header: "Created",   render: (r) => <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleTimeString()}</span> },
];

export default function RidesPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RideDoc | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminRides", "full"],
    queryFn: () => api.listRides(user!.accessToken, 1),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const rides = data?.rides ?? [];
  const filtered = rides.filter((r) => !search || r._id.includes(search) || r.riderId.includes(search));
  const active    = filtered.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status));
  const completed = filtered.filter((r) => r.status === "COMPLETED");
  const cancelled = filtered.filter((r) => r.status === "CANCELLED");

  const avgFare = completed.length > 0
    ? Math.floor(completed.reduce((s, r) => s + (r.fareCents ?? 0), 0) / completed.length)
    : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Ride Management" subtitle="All ride events across the platform" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Rides"    value={active.length}    icon={<Map className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Completed"       value={completed.length} icon={<Map className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Cancelled"       value={cancelled.length} icon={<Map className="w-4 h-4" />} accent="red" />
        <KpiCard label="Avg Fare"        value={avgFare ? formatCurrency(avgFare) : "—"} icon={<Map className="w-4 h-4" />} accent="amber" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input className="pl-10" placeholder="Search by ride ID or rider ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">       <DataTable columns={columns} data={filtered}   onRowClick={setSelected} /></TabsContent>
          <TabsContent value="active">    <DataTable columns={columns} data={active}      onRowClick={setSelected} /></TabsContent>
          <TabsContent value="completed"> <DataTable columns={columns} data={completed}   onRowClick={setSelected} /></TabsContent>
          <TabsContent value="cancelled"> <DataTable columns={columns} data={cancelled}   onRowClick={setSelected} /></TabsContent>
        </Tabs>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-gray-400">No rides yet</p>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ride #{selected?._id.slice(-6)}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Status",        <StatusChip key="s" status={selected.status} />],
                  ["City",          selected.cityId.toUpperCase()],
                  ["Class",         selected.vehicleClass],
                  ["Fare",          selected.fareCents ? formatCurrency(selected.fareCents) : "—"],
                  ["Rider ID",      selected.riderId.slice(-8)],
                  ["Driver ID",     selected.driverId ? selected.driverId.slice(-8) : "Not assigned"],
                  ["Created",       new Date(selected.createdAt).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-gray-500 text-xs mb-1">{label as string}</p>
                    <div className="font-medium text-white">{value as React.ReactNode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
