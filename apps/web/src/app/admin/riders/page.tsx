"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusChip } from "@/components/shared/StatusChip";
import { KpiCard } from "@/components/shared/KpiCard";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { api, type RiderDoc } from "@/lib/api";

const columns: Column<RiderDoc>[] = [
  { key: "name", header: "Rider", render: (r) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">{r.name[0]}</div>
      <div>
        <p className="font-medium text-white">{r.name}</p>
        <p className="text-xs text-gray-500">{r.email}</p>
      </div>
    </div>
  )},
  { key: "status",    header: "Status",  render: (r) => <StatusChip status={r.status} /> },
  { key: "phone",     header: "Phone",   render: (r) => <span className="text-gray-300 text-xs">{r.phone || "—"}</span> },
  { key: "createdAt", header: "Joined",  render: (r) => <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span> },
];

export default function RidersPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adminRiders", "full"],
    queryFn: () => api.listRiders(user!.accessToken, 1),
    enabled: !!user,
  });

  const riders = data?.riders ?? [];
  const filtered = riders.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.email.includes(search)
  );

  const active    = riders.filter((r) => r.status === "ACTIVE").length;
  const suspended = riders.filter((r) => r.status === "SUSPENDED").length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Rider Management" subtitle={`${data?.total ?? 0} registered riders`} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Riders" value={(data?.total ?? 0).toLocaleString()} icon={<Users className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Active"       value={active}                               icon={<Users className="w-4 h-4" />} accent="emerald" />
        <KpiCard label="Suspended"    value={suspended}                            icon={<Users className="w-4 h-4" />} accent="red" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input className="pl-10" placeholder="Search riders…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-400">No riders registered yet</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}
    </div>
  );
}
