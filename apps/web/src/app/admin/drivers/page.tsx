"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserCheck, UserX, Car, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusChip } from "@/components/shared/StatusChip";
import { KpiCard } from "@/components/shared/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { api, type DriverDoc } from "@/lib/api";
import { toast } from "sonner";

const columns: Column<DriverDoc>[] = [
  { key: "name", header: "Driver", render: (d) => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">{d.name[0]}</div>
      <div>
        <p className="font-medium text-white">{d.name}</p>
        <p className="text-xs text-gray-500">{d.email}</p>
      </div>
    </div>
  )},
  { key: "vehicle", header: "Vehicle", render: (d) => (
    <div>
      <p className="font-medium">{d.vehicle.make} {d.vehicle.model}</p>
      <p className="text-xs text-gray-500">{d.vehicle.plate} · {d.vehicle.class}</p>
    </div>
  )},
  { key: "verificationStatus", header: "Verification", render: (d) => <StatusChip status={d.verificationStatus} /> },
  { key: "availability",       header: "Status",       render: (d) => <StatusChip status={d.availability} /> },
  { key: "createdAt",          header: "Joined",       render: (d) => <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</span> },
];

export default function DriversPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DriverDoc | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminDrivers", "full"],
    queryFn: () => api.listDrivers(user!.accessToken, 1),
    enabled: !!user,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.verifyDriver(id, status, user!.accessToken),
    onSuccess: (_, vars) => {
      toast.success(`Driver ${vars.status.toLowerCase()}`);
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["adminDrivers"] });
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Failed"),
  });

  const drivers = data?.drivers ?? [];
  const filtered = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.email.includes(search)
  );

  const approved = drivers.filter((d) => d.verificationStatus === "APPROVED").length;
  const pending  = drivers.filter((d) => d.verificationStatus === "PENDING").length;
  const online   = drivers.filter((d) => d.availability === "ONLINE").length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Driver Management" subtitle={`${data?.total ?? 0} registered drivers`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Drivers"       value={data?.total ?? 0}  icon={<Car className="w-4 h-4" />}      accent="emerald" />
        <KpiCard label="Approved"            value={approved}           icon={<UserCheck className="w-4 h-4" />} accent="blue" />
        <KpiCard label="Pending Verification" value={pending}           icon={<Car className="w-4 h-4" />}      accent="amber" />
        <KpiCard label="Currently Online"    value={online}             icon={<Car className="w-4 h-4" />}      accent="cyan" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input className="pl-10" placeholder="Search drivers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🚗</p>
          <p className="text-gray-400">No drivers registered yet</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} onRowClick={setSelected} />
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Driver Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold">{selected.name[0]}</div>
                <div>
                  <p className="font-bold text-white">{selected.name}</p>
                  <p className="text-sm text-gray-400">{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Verification", <StatusChip key="v" status={selected.verificationStatus} />],
                  ["Availability", <StatusChip key="a" status={selected.availability} />],
                  ["City",         selected.cityId.toUpperCase()],
                  ["Vehicle",      `${selected.vehicle.make} ${selected.vehicle.model}`],
                  ["Plate",        selected.vehicle.plate],
                  ["Class",        selected.vehicle.class],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-gray-500 text-xs mb-1">{label as string}</p>
                    <div className="font-medium text-white capitalize">{value as React.ReactNode}</div>
                  </div>
                ))}
              </div>
              {selected.verificationStatus === "PENDING" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="default" size="sm" className="flex-1"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: selected._id, status: "APPROVED" })}>
                    <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Approve
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: selected._id, status: "REJECTED" })}>
                    <UserX className="w-3.5 h-3.5 mr-1.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
