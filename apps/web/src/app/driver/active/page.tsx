"use client";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, MessageCircle, Navigation, MapPin, Check, Loader2 } from "lucide-react";
import { MapView } from "@/components/shared/MapView";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useRideStore } from "@/store/rideStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ActiveRidePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: ride, isLoading } = useQuery({
    queryKey: ["driverCurrentRide"],
    queryFn: () => api.getDriverCurrentRide(user!.accessToken),
    enabled: !!user,
    refetchInterval: 5000,
  });

  const arrivedMutation = useMutation({
    mutationFn: (rideId: string) => api.markDriverArrived(rideId, user!.accessToken),
    onSuccess: () => {
      toast.success("Marked as arrived at pickup");
      queryClient.invalidateQueries({ queryKey: ["driverCurrentRide"] });
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Failed"),
  });

  const startMutation = useMutation({
    mutationFn: (rideId: string) => api.startRide(rideId, user!.accessToken),
    onSuccess: () => {
      toast.success("Ride started!");
      queryClient.invalidateQueries({ queryKey: ["driverCurrentRide"] });
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Failed"),
  });

  const completeMutation = useMutation({
    mutationFn: (rideId: string) => api.completeRide(rideId, user!.accessToken, ride?.fareCents ?? 1200),
    onSuccess: () => {
      toast.success("Ride completed! Great job.");
      queryClient.invalidateQueries({ queryKey: ["driverCurrentRide"] });
      queryClient.invalidateQueries({ queryKey: ["driverEarnings"] });
      setTimeout(() => router.push("/driver/dashboard"), 2000);
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Failed"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex flex-col min-h-full bg-black items-center justify-center p-8 gap-4">
        <span className="text-4xl">🏁</span>
        <p className="text-gray-400 font-medium text-center">No active ride</p>
        <Button variant="outline" onClick={() => router.push("/driver/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const isPending = arrivedMutation.isPending || startMutation.isPending || completeMutation.isPending;

  const PHASE_META: Record<string, { label: string; btn: string | null; color: string }> = {
    DRIVER_ASSIGNED: { label: "Heading to pickup", btn: "I've Arrived", color: "text-blue-400" },
    DRIVER_ARRIVED:  { label: "Waiting for rider", btn: "Start Ride",   color: "text-amber-400" },
    STARTED:         { label: "Ride in progress",  btn: "Complete Ride",color: "text-emerald-400" },
    COMPLETED:       { label: "Ride completed!",   btn: null,           color: "text-emerald-400" },
  };

  const meta = PHASE_META[ride.status] ?? { label: ride.status, btn: null, color: "text-gray-400" };

  function handleAction() {
    if (ride.status === "DRIVER_ASSIGNED") arrivedMutation.mutate(ride._id);
    else if (ride.status === "DRIVER_ARRIVED") startMutation.mutate(ride._id);
    else if (ride.status === "STARTED") completeMutation.mutate(ride._id);
  }

  return (
    <div className="flex flex-col min-h-full bg-black animate-fade-in">
      <MapView height="h-60" showSurge={false} />

      <div className="p-4 space-y-4">
        <div className={cn("flex items-center justify-between p-4 rounded-2xl border bg-gray-900/50",
          ride.status === "STARTED" ? "border-emerald-500/30" : "border-gray-800")}>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Current Status</p>
            <p className={cn("text-base font-bold", meta.color)}>{meta.label}</p>
          </div>
          <StatusChip status={ride.status} />
        </div>

        <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-lg font-black text-blue-400">R</div>
            <div className="flex-1">
              <p className="font-bold text-white">Rider</p>
              <p className="text-xs text-gray-500">Ride #{ride._id.slice(-6)}</p>
            </div>
            {ride.fareCents && <p className="text-xl font-black text-emerald-400">{formatCurrency(ride.fareCents)}</p>}
          </div>

          <div className="space-y-2 text-sm border-t border-gray-800 pt-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="w-px h-6 bg-gray-700" />
                <MapPin className="w-3 h-3 text-red-400" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-white font-medium">{ride.pickup.lat.toFixed(4)}, {ride.pickup.lng.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Drop-off</p>
                  <p className="text-white font-medium">{ride.dropoff.lat.toFixed(4)}, {ride.dropoff.lng.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5"><Phone className="w-3.5 h-3.5" /> Call</Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Message</Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5"><Navigation className="w-3.5 h-3.5" /> Navigate</Button>
          </div>
        </div>

        {meta.btn && (
          <Button
            size="lg"
            className={cn("w-full", ride.status === "STARTED" ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "bg-blue-500 hover:bg-blue-600 text-white")}
            onClick={handleAction}
            disabled={isPending}>
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : ride.status === "STARTED" ? <span className="flex items-center gap-2"><Check className="w-4 h-4" />{meta.btn}</span> : meta.btn}
          </Button>
        )}

        {ride.status === "COMPLETED" && (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white font-bold">Ride completed!</p>
            <Button className="w-full" onClick={() => router.push("/driver/dashboard")}>Back to Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
}
