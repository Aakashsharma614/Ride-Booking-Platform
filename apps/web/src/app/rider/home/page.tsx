"use client";
import { useRouter } from "next/navigation";
import { Search, MapPin, Navigation, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MapView } from "@/components/shared/MapView";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useRideStore } from "@/store/rideStore";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function RiderHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { setPickupAddress, setDropoffAddress, setBookingStep } = useRideStore();

  const { data: ridesData } = useQuery({
    queryKey: ["myRides", "recent"],
    queryFn: () => api.getMyRides(user!.accessToken, 1, 5),
    enabled: !!user,
  });

  const recentRides = ridesData?.rides ?? [];

  function startBooking(address?: string) {
    setPickupAddress("Current Location");
    if (address) { setDropoffAddress(address); setBookingStep(1); }
    else setBookingStep(0);
    router.push("/rider/book");
  }

  return (
    <div className="flex flex-col min-h-full bg-black animate-fade-in">
      <div className="px-4 pt-4 pb-3">
        <p className="text-gray-400 text-sm">Good day,</p>
        <h2 className="text-xl font-black text-white">{user?.name?.split(" ")[0] ?? "Rider"} 👋</h2>
      </div>

      <div className="px-4 mb-4">
        <MapView height="h-52" showSurge className="rounded-2xl" />
      </div>

      <div className="px-4 mb-4">
        <button
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-800 bg-gray-900 transition-all hover:border-emerald-500/50"
          onClick={() => startBooking()}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-black" />
          </div>
          <span className="text-gray-400 flex-1 text-left text-sm">Where to?</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-400">
            <Clock className="w-3 h-3" /> Schedule
          </div>
        </button>
      </div>

      {recentRides.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Rides</h3>
          <div className="space-y-1">
            {recentRides.map((r) => (
              <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-900 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white capitalize">{r.vehicleClass} ride</p>
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()} · {r.fareCents ? formatCurrency(r.fareCents) : "—"}</p>
                </div>
                <span className={`text-xs font-medium ${r.status === "COMPLETED" ? "text-emerald-400" : r.status === "CANCELLED" ? "text-red-400" : "text-amber-400"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentRides.length === 0 && (
        <div className="px-4 mb-4 text-center py-6">
          <p className="text-gray-500 text-sm">No rides yet — book your first ride!</p>
        </div>
      )}

      <div className="px-4 pb-4">
        <Button size="lg" className="w-full" onClick={() => startBooking()}>
          Book a Ride
        </Button>
      </div>
    </div>
  );
}
