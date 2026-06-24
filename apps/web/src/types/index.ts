export type UserRole = "RIDER" | "DRIVER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessToken: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type RideStatus =
  | "REQUESTED" | "MATCHING" | "DRIVER_ASSIGNED"
  | "DRIVER_ARRIVED" | "STARTED" | "COMPLETED" | "CANCELLED";

export type DriverAvailability = "ONLINE" | "OFFLINE" | "IN_RIDE";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";

export interface Rider {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "SUSPENDED";
  totalRides: number;
  totalSpendCents: number;
  createdAt: string;
}

export interface Driver {
  id: string;
  email: string;
  name: string;
  phone: string;
  cityId: string;
  vehicle: { plate: string; make: string; model: string; class: string };
  verificationStatus: VerificationStatus;
  availability: DriverAvailability;
  rating: number;
  totalTrips: number;
  totalEarningsCents: number;
  createdAt: string;
}

export interface Ride {
  id: string;
  riderId: string;
  riderName?: string;
  driverId?: string;
  driverName?: string;
  cityId: string;
  vehicleClass: string;
  pickup: GeoPoint & { address?: string };
  dropoff: GeoPoint & { address?: string };
  status: RideStatus;
  fareCents?: number;
  distanceKm?: number;
  durationSeconds?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  rideId: string;
  riderId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PricingQuote {
  rideId?: string;
  cityId: string;
  vehicleClass: string;
  baseCents: number;
  distanceCents: number;
  surgeMultiplier: number;
  totalCents: number;
  currency: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  channel: "PUSH" | "EMAIL" | "SMS";
  template: string;
  status: "QUEUED" | "SENT" | "FAILED";
  createdAt: string;
}

export interface ServiceHealth {
  name: string;
  port: number;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  errorRate: number;
  requestsPerMinute: number;
}

export interface AnalyticsSummary {
  completedRides: number;
  revenueCents: number;
}

export interface KpiData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
  color?: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  value2?: number;
}
