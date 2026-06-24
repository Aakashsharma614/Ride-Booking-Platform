"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageCircle, Star, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapView } from "@/components/shared/MapView";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

const TERMINAL = new Set(["COMPLETED", "CANCELLED"]);

export default function RideTrackingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);

  const { data: ride, isLoading } = useQuery({
    queryKey: ["ride", id],
    queryFn: () => api.getRide(id, user!.accessToken),
    enabled: !!user && !!id,
    refetchInterval: (query) => TERMINAL.has(query.state.data?.status ?? "") ? false : 4000,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelRide(id, user!.accessToken, "rider_cancelled"),
    onSuccess: () => {
      toast.success("Ride cancelled");
      queryClient.invalidateQueries({ queryKey: ["ride", id] });
    },
    onError: (err: unknown) => toast.error((err as Error).message ?? "Cannot cancel at this stage"),
  });

  if (isLoading || !ride) {
    return (
      <div className="flex flex-col min-h-full bg-black items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-gray-400 text-sm">Loading ride…</p>
      </div>
    );
  }

  const cancellable = ["REQUESTED", "MATCHING", "DRIVER_ASSIGNED"].includes(ride.status);
  const isCompleted = ride.status === "COMPLETED";
  const isCancelled = ride.status === "CANCELLED";

  return (
    <div className="flex flex-col min-h-full bg-black animate-fade-in">
      <MapView height="h-64" showSurge={false} />

      {!isCompleted && !isCancelled ? (
        <div className="p-4 space-y-4">
          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Ride Status</p>
                <p className="text-base font-bold text-white">{ride.status.replace(/_/g, " ")}</p>
              </div>
              <StatusChip status={ride.status} />
            </div>

            {(ride.status === "REQUESTED" || ride.status === "MATCHING") && (
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 animate-ping absolute inset-0" />
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
                    <span className="text-2xl">📡</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center">Finding your driver…</p>
              </div>
            )}

            {ride.status === "DRIVER_ASSIGNED" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <span>🚗</span> Driver assigned — on the way to pickup
              </div>
            )}

            {ride.status === "DRIVER_ARRIVED" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                <Check className="w-4 h-4" /> Your driver has arrived!
              </div>
            )}

            {ride.status === "STARTED" && (
              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-gray-800/50">
                <span className="text-gray-400">Ride in progress</span>
                <span className="font-semibold text-white">En route</span>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Call
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Message
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50 text-sm">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div className="w-px flex-1 bg-gray-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-white">{ride.pickup.lat.toFixed(4)}, {ride.pickup.lng.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Drop-off</p>
                  <p className="text-white">{ride.dropoff.lat.toFixed(4)}, {ride.dropoff.lng.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          {cancellable && (
            <Button variant="outline" size="lg" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Ride"}
            </Button>
          )}
        </div>
      ) : isCancelled ? (
        <div className="p-4 space-y-4 animate-slide-up">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-black text-white">Ride Cancelled</h2>
          </div>
          <Button size="lg" className="w-full" onClick={() => router.push("/rider/home")}>Back to Home</Button>
        </div>
      ) : (
        <div className="p-4 space-y-4 animate-slide-up">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Ride Complete!</h2>
          </div>

          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50 space-y-3 text-sm">
            <div className="flex justify-between text-gray-300 font-black text-base border-b border-gray-800 pb-3">
              <span>Total Fare</span>
              <span className="text-emerald-400">{ride.fareCents ? formatCurrency(ride.fareCents) : "—"}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Class</span>
              <span className="text-white capitalize">{ride.vehicleClass}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Completed</span>
              <span className="text-white">{new Date(ride.updatedAt ?? ride.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-gray-800 bg-gray-900/50">
            <p className="text-sm font-semibold text-white mb-3">Rate your driver</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={cn("w-8 h-8 transition-colors", rating >= s ? "fill-amber-400 text-amber-400" : "text-gray-700")} />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-center text-sm text-gray-400">{["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}!</p>}
          </div>

          <Button size="lg" className="w-full" onClick={() => router.push("/rider/home")}>Done</Button>
        </div>
      )}
    </div>
  );
}
