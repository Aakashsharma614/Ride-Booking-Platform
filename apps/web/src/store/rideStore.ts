import { create } from "zustand";
import type { Ride, PricingQuote } from "@/types";

interface RideState {
  activeRide: Ride | null;
  quote: PricingQuote | null;
  bookingStep: number;
  pickupAddress: string;
  dropoffAddress: string;
  selectedVehicleClass: string;
  setActiveRide: (ride: Ride | null) => void;
  setQuote: (quote: PricingQuote | null) => void;
  setBookingStep: (step: number) => void;
  setPickupAddress: (addr: string) => void;
  setDropoffAddress: (addr: string) => void;
  setSelectedVehicleClass: (cls: string) => void;
  reset: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  quote: null,
  bookingStep: 0,
  pickupAddress: "",
  dropoffAddress: "",
  selectedVehicleClass: "economy",
  setActiveRide: (activeRide) => set({ activeRide }),
  setQuote: (quote) => set({ quote }),
  setBookingStep: (bookingStep) => set({ bookingStep }),
  setPickupAddress: (pickupAddress) => set({ pickupAddress }),
  setDropoffAddress: (dropoffAddress) => set({ dropoffAddress }),
  setSelectedVehicleClass: (selectedVehicleClass) => set({ selectedVehicleClass }),
  reset: () => set({ activeRide: null, quote: null, bookingStep: 0, pickupAddress: "", dropoffAddress: "" }),
}));
