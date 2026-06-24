"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Phone, Car, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/shared/StatusChip";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function DriverProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driverProfile"],
    queryFn: () => api.getDriver(user!.accessToken),
    enabled: !!user,
  });

  const { data: earnings } = useQuery({
    queryKey: ["driverEarnings", user?.id],
    queryFn: () => api.getDriverEarnings(user!.id, user!.accessToken),
    enabled: !!user,
  });

  function handleLogout() {
    logout();
    toast.success("Signed out");
    router.push("/driver/login");
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-24 rounded-2xl bg-gray-900 animate-pulse" />
        <div className="h-20 rounded-2xl bg-gray-900 animate-pulse" />
      </div>
    );
  }

  const name = driver?.name ?? user?.name ?? "Driver";
  const email = driver?.email ?? user?.email ?? "";
  const phone = driver?.phone ?? "";
  const totalTrips = earnings?.trips ?? 0;
  const totalEarnings = earnings?.totalCents ?? 0;

  return (
    <div className="p-4 animate-fade-in space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-500/40 flex items-center justify-center text-2xl font-black text-white">
          {name[0]}
        </div>
        <div className="flex-1">
          <p className="text-lg font-black text-white">{name}</p>
          <p className="text-sm text-gray-400">{email}</p>
          <div className="flex items-center gap-2 mt-1">
            {driver?.verificationStatus && <StatusChip status={driver.verificationStatus} className="scale-90 origin-left" />}
            {driver?.availability && <StatusChip status={driver.availability} className="scale-90 origin-left" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        {[
          { label: "Total Trips", value: totalTrips.toLocaleString() },
          { label: "Total Earnings", value: `$${(totalEarnings / 100).toFixed(0)}` },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-2xl border border-gray-800 bg-gray-900/50">
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <p className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Personal Information</p>
        {[
          { icon: User,  label: "Full Name", value: name },
          { icon: Mail,  label: "Email",     value: email },
          { icon: Phone, label: "Phone",     value: phone || "—" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0">
            <f.icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{f.label}</p>
              <p className="text-sm font-medium text-white">{f.value}</p>
            </div>
          </div>
        ))}
      </div>

      {driver?.vehicle && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          <p className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Vehicle</p>
          {[
            { label: "Make / Model", value: `${driver.vehicle.make} ${driver.vehicle.model}` },
            { label: "Plate", value: driver.vehicle.plate },
            { label: "Class", value: driver.vehicle.class },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0">
              <Car className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">{f.label}</p>
                <p className="text-sm font-medium text-white capitalize">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="destructive" size="lg" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}
