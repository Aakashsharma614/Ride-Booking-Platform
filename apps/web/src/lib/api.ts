const GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as Record<string, string> ?? {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${GATEWAY}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? body.error ?? "Request failed");
  }
  return res.json();
}

export type RideStatus = "REQUESTED" | "MATCHING" | "DRIVER_ASSIGNED" | "DRIVER_ARRIVED" | "STARTED" | "COMPLETED" | "CANCELLED";

export interface RideDoc {
  _id: string;
  riderId: string;
  driverId?: string;
  cityId: string;
  vehicleClass: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  status: RideStatus;
  fareCents?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DriverDoc {
  _id: string;
  email: string;
  name: string;
  phone: string;
  cityId: string;
  vehicle: { plate: string; make: string; model: string; class: string };
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  availability: "ONLINE" | "OFFLINE" | "IN_RIDE";
  createdAt: string;
}

export interface RiderDoc {
  _id: string;
  email: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface PaymentDoc {
  _id: string;
  rideId: string;
  riderId: string;
  amountCents: number;
  currency: string;
  status: "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";
  createdAt: string;
}

export interface NotificationDoc {
  _id: string;
  recipientId: string;
  channel: string;
  template: string;
  data?: Record<string, unknown>;
  status: "QUEUED" | "SENT" | "FAILED";
  createdAt: string;
}

export interface QuoteDoc {
  totalCents: number;
  surgeMultiplier: number;
  baseCents: number;
  distanceCents: number;
  currency?: string;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  riderLogin: (email: string, password: string) =>
    request<{ accessToken: string }>("/riders/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  riderRegister: (data: { email: string; password: string; name: string; phone: string }) =>
    request<{ id: string; email: string; name: string; phone: string }>("/riders/register", { method: "POST", body: JSON.stringify(data) }),
  driverLogin: (email: string, password: string) =>
    request<{ accessToken: string }>("/drivers/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  driverRegister: (data: { email: string; password: string; name: string; phone: string; cityId: string; vehicle: { plate: string; make: string; model: string; class: string } }) =>
    request<{ id: string; verificationStatus: string }>("/drivers/register", { method: "POST", body: JSON.stringify(data) }),
  adminLogin: (email: string, password: string) =>
    request<{ accessToken: string }>("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  // ── Rider profile ─────────────────────────────────────────────────────────
  getMe: (token: string) => request<RiderDoc>("/riders/me", undefined, token),
  updateRiderProfile: (token: string, data: { name?: string; phone?: string }) =>
    request<RiderDoc>("/riders/me", { method: "PATCH", body: JSON.stringify(data) }, token),

  // ── Driver profile ────────────────────────────────────────────────────────
  getDriver: (token: string) => request<DriverDoc>("/drivers/me", undefined, token),
  goOnline: (token: string) => request<{ availability: string }>("/drivers/me/online", { method: "POST" }, token),
  goOffline: (token: string) => request<{ availability: string }>("/drivers/me/offline", { method: "POST" }, token),
  updateDriverLocation: (token: string, data: { lat: number; lng: number; cityId: string; heading?: number; speedKph?: number }) =>
    request<{ accepted: boolean }>("/drivers/me/location", { method: "POST", body: JSON.stringify(data) }, token),

  // ── Rides ─────────────────────────────────────────────────────────────────
  requestRide: (token: string, data: { pickup: { lat: number; lng: number }; dropoff: { lat: number; lng: number }; cityId: string; vehicleClass: string }) =>
    request<{ rideId: string; status: string }>("/rides", { method: "POST", body: JSON.stringify(data) }, token),
  getRide: (id: string, token: string) => request<RideDoc>(`/rides/${id}`, undefined, token),
  getMyRides: (token: string, page = 1, limit = 20) =>
    request<{ rides: RideDoc[]; total: number; page: number; pages: number }>(`/rides?page=${page}&limit=${limit}`, undefined, token),
  getActiveRide: (token: string) => request<RideDoc | null>("/rides/me/active", undefined, token),
  getDriverCurrentRide: (token: string) => request<RideDoc | null>("/rides/driver/current", undefined, token),
  markDriverArrived: (id: string, token: string) => request<RideDoc>(`/rides/${id}/arrived`, { method: "POST" }, token),
  startRide: (id: string, token: string) => request<RideDoc>(`/rides/${id}/start`, { method: "POST" }, token),
  completeRide: (id: string, token: string, fareCents: number) =>
    request<RideDoc>(`/rides/${id}/complete`, { method: "POST", body: JSON.stringify({ fareCents }) }, token),
  cancelRide: (id: string, token: string, reason?: string) =>
    request<RideDoc>(`/rides/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }, token),

  // ── Pricing ───────────────────────────────────────────────────────────────
  getQuote: (data: { cityId: string; vehicleClass: string; pickup: { lat: number; lng: number }; dropoff: { lat: number; lng: number } }) =>
    request<QuoteDoc>("/pricing/quote", { method: "POST", body: JSON.stringify(data) }),
  getPricingQuoteByRide: (rideId: string) =>
    request<QuoteDoc & { vehicleClass?: string; rideId?: string }>(`/pricing/quotes/${rideId}`),

  // ── Payments ──────────────────────────────────────────────────────────────
  getPaymentsByRide: (rideId: string) => request<PaymentDoc[]>(`/payments/${rideId}`),
  getMyPayments: (token: string, page = 1) =>
    request<{ payments: PaymentDoc[]; total: number; page: number }>(`/payments/rider/me?page=${page}`, undefined, token),
  listPayments: (token: string, page = 1) =>
    request<{ payments: PaymentDoc[]; total: number; page: number }>(`/payments?page=${page}`, undefined, token),

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: (recipientId: string, token: string) =>
    request<NotificationDoc[]>(`/notifications/${recipientId}`, undefined, token),
  listNotifications: (token: string, page = 1) =>
    request<{ notifications: NotificationDoc[]; total: number; page: number }>(`/notifications?page=${page}`, undefined, token),

  // ── Analytics ─────────────────────────────────────────────────────────────
  getSummary: () => request<{ completedRides: number; revenueCents: number }>("/analytics/summary"),
  getTimeSeries: () =>
    request<{ daily: Array<{ _id: string; rides: number; revenue: number }>; weekly: Array<{ _id: string; rides: number; revenue: number }> }>("/analytics/timeseries"),
  getDriverEarnings: (driverId: string, token: string) =>
    request<{ totalCents: number; trips: number; daily: Array<{ _id: string; rides: number; earningsCents: number }>; recent: Array<{ rideId: string; amountCents: number; occurredAt: string }> }>(`/analytics/driver/${driverId}/earnings`, undefined, token),

  // ── Location ──────────────────────────────────────────────────────────────
  getNearbyDrivers: (token: string, cityId: string, lat: number, lng: number, radiusKm = 5) =>
    request<Array<{ driverId: string; distanceKm: number }>>(`/drivers/nearby?cityId=${cityId}&lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`, undefined, token),

  // ── Admin ─────────────────────────────────────────────────────────────────
  verifyDriver: (id: string, status: string, token: string) =>
    request<DriverDoc>(`/admin/drivers/${id}/verification`, { method: "PATCH", body: JSON.stringify({ status }) }, token),
  listDrivers: (token: string, page = 1) =>
    request<{ drivers: DriverDoc[]; total: number; page: number; pages: number }>(`/drivers?page=${page}`, undefined, token),
  listRiders: (token: string, page = 1) =>
    request<{ riders: RiderDoc[]; total: number; page: number; pages: number }>(`/riders?page=${page}`, undefined, token),
  listRides: (token: string, page = 1) =>
    request<{ rides: RideDoc[]; total: number; page: number; pages: number }>(`/rides?page=${page}`, undefined, token),
  getSystemHealth: (token: string) =>
    request<Array<{ name: string; status: "healthy" | "degraded" | "down"; latencyMs: number }>>("/admin/health", undefined, token),
};
