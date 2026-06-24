"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronRight, Clock, Check, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { MapView } from "@/components/shared/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRideStore } from "@/store/rideStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

const VEHICLE_OPTIONS = [
  { id: "economy", label: "Economy",  icon: "🚗", desc: "Affordable everyday rides" },
  { id: "comfort", label: "Comfort",  icon: "🚙", desc: "Extra comfort, newer cars" },
  { id: "premium", label: "Premium",  icon: "🚘", desc: "Luxury vehicles, top drivers" },
  { id: "xl",      label: "XL",       icon: "🚐", desc: "Up to 6 passengers" },
];

const CITY_ID = "nyc";

const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  jfk: { lat: 40.6413, lng: -73.7781 },
  laguardia: { lat: 40.7769, lng: -73.874 },
  "times square": { lat: 40.758, lng: -73.9855 },
  "brooklyn bridge": { lat: 40.7061, lng: -73.9969 },
  "central park": { lat: 40.7851, lng: -73.9683 },
  "madison square": { lat: 40.7505, lng: -73.9934 },
  "grand central": { lat: 40.7527, lng: -73.9772 },
  "penn station": { lat: 40.7506, lng: -73.9971 },
  "world trade": { lat: 40.7127, lng: -74.0134 },
  "brooklyn bridge park": { lat: 40.7003, lng: -73.9963 },
};

function addrToCoords(addr: string) {
  const lower = addr.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  const hash = [...addr].reduce((h, c) => ((h * 31) + c.charCodeAt(0)) & 0xffff, 0);
  return {
    lat: 40.758 + ((hash & 0xff) - 128) * 0.001,
    lng: -73.9855 + (((hash >> 8) & 0xff) - 128) * 0.001,
  };
}

type Step = "pickup" | "dropoff" | "select" | "confirm" | "booking";
const STEP_ORDER: Step[] = ["pickup", "dropoff", "select", "confirm", "booking"];

const QUICK_DROPOFFS = ["JFK International Airport", "Grand Central Terminal", "Brooklyn Bridge Park", "Madison Square Garden"];

export default function BookPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { pickupAddress, dropoffAddress, selectedVehicleClass, setPickupAddress, setDropoffAddress, setSelectedVehicleClass } = useRideStore();

  const [step, setStep] = useState<Step>("pickup");
  const [pickup, setPickup] = useState(pickupAddress || "Times Square, NYC");
  const [dropoff, setDropoff] = useState(dropoffAddress || "");
  const [quote, setQuote] = useState<{ totalCents: number; surgeMultiplier: number } | null>(null);

  const quoteMutation = useMutation({
    mutationFn: () => api.getQuote({
      cityId: CITY_ID,
      vehicleClass: selectedVehicleClass,
      pickup: addrToCoords(pickup),
      dropoff: addrToCoords(dropoff),
    }),
    onSuccess: (data) => { setQuote(data); setStep("confirm"); },
    onError: () => { setQuote({ totalCents: 1200, surgeMultiplier: 1 }); setStep("confirm"); },
  });

  const rideMutation = useMutation({
    mutationFn: () => api.requestRide(user!.accessToken, {
      pickup: addrToCoords(pickup),
      dropoff: addrToCoords(dropoff),
      cityId: CITY_ID,
      vehicleClass: selectedVehicleClass,
    }),
    onSuccess: (data) => {
      toast.success("Ride requested! Finding your driver…");
      router.push(`/rider/ride/${data.rideId}`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message ?? "Failed to book ride");
      setStep("confirm");
    },
  });

  function next() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }

  const fare = quote?.totalCents ?? null;
  const surge = quote?.surgeMultiplier ?? 1;

  return (
    <div className="flex flex-col min-h-full bg-black animate-fade-in">
      <div className="relative">
        <MapView height="h-52" showSurge={step !== "booking"} />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {(["pickup", "dropoff", "select", "confirm"] as Step[]).map((s) => (
            <div key={s} className={cn("h-1.5 rounded-full transition-all",
              step === s ? "w-6 bg-white" : STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(s) ? "w-1.5 bg-emerald-400" : "w-1.5 bg-gray-600")} />
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">

        {step === "pickup" && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-white">Where are you?</h2>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400" />
              <Input className="pl-9" placeholder="Pickup location" value={pickup} onChange={(e) => setPickup(e.target.value)} />
            </div>
            <Button size="lg" className="w-full" onClick={() => { setPickupAddress(pickup); next(); }}>
              Confirm Pickup <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === "dropoff" && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-white">Where to?</h2>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2.5 text-sm text-gray-400">
              <div className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />{pickup}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input className="pl-9" placeholder="Drop-off address" value={dropoff} onChange={(e) => setDropoff(e.target.value)} autoFocus />
            </div>
            {QUICK_DROPOFFS.filter((s) => !dropoff || s.toLowerCase().includes(dropoff.toLowerCase())).map((s) => (
              <button key={s} className="w-full flex items-center gap-2.5 p-3 rounded-xl hover:bg-gray-900 transition-colors text-left"
                onClick={() => { setDropoff(s); setDropoffAddress(s); }}>
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-300">{s}</span>
              </button>
            ))}
            <Button size="lg" className="w-full" disabled={!dropoff} onClick={() => { setDropoffAddress(dropoff); next(); }}>
              Confirm Drop-off <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === "select" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-lg font-bold text-white">Choose your ride</h2>
            <div className="space-y-2">
              {VEHICLE_OPTIONS.map((v) => (
                <button key={v.id}
                  className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border transition-all",
                    selectedVehicleClass === v.id ? "border-emerald-500 bg-emerald-500/5" : "border-gray-800 bg-gray-900/50 hover:border-gray-700")}
                  onClick={() => setSelectedVehicleClass(v.id)}>
                  <span className="text-2xl">{v.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-white text-sm">{v.label}</p>
                    <p className="text-xs text-gray-500">{v.desc}</p>
                  </div>
                  {selectedVehicleClass === v.id && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => quoteMutation.mutate()} disabled={quoteMutation.isPending}>
              {quoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Get Quote for ${VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleClass)?.label}`}
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-lg font-bold text-white">Confirm your ride</h2>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="w-px flex-1 bg-gray-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div><p className="text-xs text-gray-500 mb-0.5">Pickup</p><p className="text-sm font-medium text-white">{pickup}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Drop-off</p><p className="text-sm font-medium text-white">{dropoff}</p></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Fare", value: fare ? formatCurrency(fare) : "—" },
                { label: "Class", value: selectedVehicleClass },
                { label: "Surge", value: `${surge}×` },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <p className="text-lg font-black text-white capitalize">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep("select")}>Back</Button>
              <Button size="lg" className="flex-1" onClick={() => { setStep("booking"); rideMutation.mutate(); }} disabled={rideMutation.isPending}>
                Confirm Ride
              </Button>
            </div>
          </div>
        )}

        {step === "booking" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-500/30 animate-ping absolute inset-0" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                <span className="text-3xl">🚗</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">Requesting ride…</p>
              <p className="text-sm text-gray-400">Connecting to the platform</p>
            </div>
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
