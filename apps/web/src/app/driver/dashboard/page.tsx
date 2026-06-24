"use client";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation, DollarSign } from "lucide-react";
import { MapView } from "@/components/shared/MapView";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/KpiCard";
import { useAuthStore } from "@/store/authStore";
import { useRideStore } from "@/store/rideStore";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { setActiveRide } = useRideStore();
  const queryClient = useQueryClient();

  const { data: driver } = useQuery({
    queryKey: ["driverProfile"],
    queryFn: () => api.getDriver(user!.accessToken),
    enabled: !!user,
  });

  const online = driver?.availability === "ONLINE" || driver?.availability === "IN_RIDE";

  const { data: currentRide } = useQuery({
    queryKey: ["driverCurrentRide"],
    queryFn: () => api.getDriverCurrentRide(user!.accessToken),
    enabled: !!user && online,
    refetchInterval: 5000,
  });

  const { data: earnings } = useQuery({
    queryKey: ["driverEarnings", user?.id],
    queryFn: () => api.getDriverEarnings(user!.id, user!.accessToken),
    enabled: !!user,
  });

  const goOnlineMutation = useMutation({
    mutationFn: () => api.goOnline(user!.accessToken),
    onSuccess: () => {
      toast.success("You're online! Looking for rides…");
      queryClient.invalidateQueries({ queryKey: ["driverProfile"] });
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Failed to go online"),
  });

  const goOfflineMutation = useMutation({
    mutationFn: () => api.goOffline(user!.accessToken),
    onSuccess: () => {
      toast.success("You're now offline");
      queryClient.invalidateQueries({ queryKey: ["driverProfile"] });
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Failed to go offline"),
  });

  function handleToggle() {
    if (online) goOfflineMutation.mutate();
    else goOnlineMutation.mutate();
  }

  function goToActive() {
    if (currentRide) {
      setActiveRide({ ...currentRide, id: currentRide._id } as any);
      router.push("/driver/active");
    }
  }

  const todayEarnings = earnings?.totalCents ?? 0;
  const todayTrips = earnings?.trips ?? 0;

  return (
    <div className="flex flex-col min-h-full bg-black animate-fade-in">
      <div className="relative">
        <MapView height="h-56" showSurge={online} />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button
            onClick={handleToggle}
            disabled={goOnlineMutation.isPending || goOfflineMutation.isPending}
            className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold shadow-2xl transition-all disabled:opacity-50",
              online ? "bg-blue-500 text-white shadow-blue-500/30" : "bg-gray-800 text-gray-300 hover:bg-gray-700")}>
            <span className={cn("w-2 h-2 rounded-full", online ? "bg-white animate-pulse" : "bg-gray-500")} />
            {online ? "Online" : "Go Online"}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-gray-400 text-sm">Good day,</p>
          <h2 className="text-xl font-black text-white">{user?.name?.split(" ")[0] ?? "Driver"} 👋</h2>
        </div>

        {currentRide && (
          <div className="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-4 space-y-3 animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">Active Ride</p>
                <p className="font-bold text-white text-sm">Status: {currentRide.status.replace(/_/g, " ")}</p>
              </div>
              <span className="text-2xl">🚗</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex gap-2 text-gray-400">
                <span className="text-emerald-400">From:</span>
                {currentRide.pickup.lat.toFixed(4)}, {currentRide.pickup.lng.toFixed(4)}
              </div>
              <div className="flex gap-2 text-gray-400">
                <span className="text-red-400">To:</span>
                {currentRide.dropoff.lat.toFixed(4)}, {currentRide.dropoff.lng.toFixed(4)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">{currentRide.fareCents ? formatCurrency(currentRide.fareCents) : "Fare pending"}</span>
              <Navigation className="w-3.5 h-3.5 ml-2" />
              <span>{currentRide.vehicleClass}</span>
            </div>
            <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600" onClick={goToActive}>
              Go to Active Ride
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Total Earnings" value={formatCurrency(todayEarnings)} accent="blue" />
          <KpiCard label="Total Trips" value={todayTrips.toString()} accent="emerald" />
        </div>

        {!online && !currentRide && (
          <div className="text-center py-8 space-y-2">
            <div className="w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🚗</span>
            </div>
            <p className="text-gray-400 font-medium">You&apos;re currently offline</p>
            <p className="text-sm text-gray-600">Go online to start receiving rides</p>
          </div>
        )}

        {online && !currentRide && (
          <div className="text-center py-8 space-y-2">
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 animate-ping absolute inset-0" />
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center">
                <span className="text-2xl">📡</span>
              </div>
            </div>
            <p className="text-white font-semibold">Looking for rides nearby…</p>
            <p className="text-xs text-gray-500">You&apos;ll be assigned automatically when a rider requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
