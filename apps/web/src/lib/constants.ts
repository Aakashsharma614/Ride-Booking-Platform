export const VEHICLE_CLASSES = [
  { id: "economy", label: "Economy", icon: "🚗", baseMultiplier: 1.0 },
  { id: "comfort", label: "Comfort", icon: "🚙", baseMultiplier: 1.4 },
  { id: "premium", label: "Premium", icon: "🚘", baseMultiplier: 2.0 },
  { id: "xl", label: "XL", icon: "🚐", baseMultiplier: 1.8 },
];

export const CITIES = [
  { id: "nyc", label: "New York", lat: 40.7128, lng: -74.006 },
  { id: "la", label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { id: "chi", label: "Chicago", lat: 41.8781, lng: -87.6298 },
  { id: "mum", label: "Mumbai", lat: 19.076, lng: 72.8777 },
  { id: "del", label: "Delhi", lat: 28.6139, lng: 77.209 },
];

export const RIDE_STATUS_STEPS = [
  { key: "REQUESTED", label: "Ride Requested" },
  { key: "MATCHING", label: "Finding Driver" },
  { key: "DRIVER_ASSIGNED", label: "Driver Assigned" },
  { key: "DRIVER_ARRIVED", label: "Driver Arrived" },
  { key: "STARTED", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
