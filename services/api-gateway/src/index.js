import rateLimit from "express-rate-limit";
import { roles, signAccessToken } from "@ride/common-security";
import { createServiceApp, errorHandler, notFoundHandler } from "@ride/common-utils";

const serviceName = "api-gateway";
const services = {
  "/riders": process.env.RIDER_SERVICE_URL ?? "http://localhost:8101",
  "/drivers": process.env.DRIVER_SERVICE_URL ?? "http://localhost:8102",
  "/rides": process.env.RIDE_SERVICE_URL ?? "http://localhost:8105",
  "/pricing": process.env.PRICING_SERVICE_URL ?? "http://localhost:8106",
  "/payments": process.env.PAYMENT_SERVICE_URL ?? "http://localhost:8107",
  "/notifications": process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:8108",
  "/analytics": process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:8109",
  "/matching": process.env.MATCHING_SERVICE_URL ?? "http://localhost:8104",
  "/admin/drivers": process.env.DRIVER_SERVICE_URL ?? "http://localhost:8102",
};

const serviceHealthUrls = {
  "rider-service":        process.env.RIDER_SERVICE_URL        ?? "http://localhost:8101",
  "driver-service":       process.env.DRIVER_SERVICE_URL       ?? "http://localhost:8102",
  "location-service":     process.env.LOCATION_SERVICE_URL  ?? "http://localhost:8103",
  "matching-service":     process.env.MATCHING_SERVICE_URL  ?? "http://localhost:8104",
  "ride-service":         process.env.RIDE_SERVICE_URL         ?? "http://localhost:8105",
  "pricing-service":      process.env.PRICING_SERVICE_URL      ?? "http://localhost:8106",
  "payment-service":      process.env.PAYMENT_SERVICE_URL      ?? "http://localhost:8107",
  "notification-service": process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:8108",
  "analytics-service":    process.env.ANALYTICS_SERVICE_URL    ?? "http://localhost:8109",
};

const app = createServiceApp({ serviceName });
app.use(rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));

// Gateway-local: admin login (not proxied)
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ridex.io";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    res.json({ accessToken: signAccessToken("admin-001", roles.ADMIN, { email }) });
  } catch {
    res.status(500).json({ error: "internal_error" });
  }
});

// Gateway-local: aggregate health check for all services
app.get("/admin/health", async (_req, res) => {
  const results = await Promise.allSettled(
    Object.entries(serviceHealthUrls).map(async ([name, url]) => {
      const start = Date.now();
      try {
        const r = await fetch(`${url}/healthz`, { signal: AbortSignal.timeout(3000) });
        return { name, status: r.ok ? "healthy" : "degraded", latencyMs: Date.now() - start };
      } catch {
        return { name, status: "down", latencyMs: Date.now() - start };
      }
    })
  );
  res.json(results.map(r => r.status === "fulfilled" ? r.value : { name: "unknown", status: "down", latencyMs: 0 }));
});

// Proxy all other requests to the matching upstream service
app.use(async (req, res, next) => {
  try {
    const prefix = Object.keys(services).find((key) => req.path.startsWith(key));
    if (!prefix) return next();
    const upstream = new URL(req.originalUrl, services[prefix]);
    const response = await fetch(upstream, {
      method: req.method,
      headers: { ...Object.fromEntries(Object.entries(req.headers).filter(([k, v]) => typeof v === "string" && k !== "content-length")), "x-forwarded-by": serviceName },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body)
    });
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) if (!["set-cookie"].includes(key)) res.setHeader(key, value);
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.API_GATEWAY_PORT ?? 8080, () => console.log(`${serviceName} listening`));
