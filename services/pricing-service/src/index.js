import mongoose from "mongoose";
import { createKafkaClient, eventTypes, topics } from "@ride/common-events";
import { asyncHandler, connectMongo, createRedis, createServiceApp, errorHandler, notFoundHandler, runIdempotently } from "@ride/common-utils";

const serviceName = "pricing-service";
const redis = createRedis();
const Quote = mongoose.model("Quote", new mongoose.Schema({
  rideId: { type: String, unique: true },
  cityId: { type: String, index: true },
  vehicleClass: String,
  baseCents: Number,
  distanceCents: Number,
  surgeMultiplier: Number,
  totalCents: Number,
  currency: { type: String, default: "USD" }
}, { timestamps: true }));

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_pricing"));
const app = createServiceApp({ serviceName });

function haversineKm(a, b) {
  const r = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

async function surgeForCity(cityId) {
  const activeDrivers = Number(await redis.scard(`city:${cityId}:active-drivers`));
  const openRequests = Number(await redis.get(`city:${cityId}:open-ride-requests`) ?? 0);
  if (activeDrivers === 0) return 2.5;
  return Math.min(3, Math.max(1, openRequests / activeDrivers));
}

app.post("/pricing/quote", asyncHandler(async (req, res) => {
  const distanceKm = haversineKm(req.body.pickup, req.body.dropoff);
  const surgeMultiplier = await surgeForCity(req.body.cityId);
  const baseCents = 325;
  const distanceCents = Math.ceil(distanceKm * 145);
  res.json({ totalCents: Math.ceil((baseCents + distanceCents) * surgeMultiplier), baseCents, distanceCents, surgeMultiplier, currency: "USD" });
}));

app.get("/pricing/quotes/:rideId", asyncHandler(async (req, res) => {
  const quote = await Quote.findOne({ rideId: req.params.rideId }).lean();
  if (!quote) return res.status(404).json({ error: "quote_not_found" });
  res.json(quote);
}));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8106, () => console.log(`${serviceName} listening`));

const kafka = createKafkaClient({ clientId: serviceName });
const consumer = kafka.consumer({ groupId: "pricing-service-rides" });
await consumer.connect();
await consumer.subscribe({ topic: topics.rideLifecycle, fromBeginning: false });
await consumer.subscribe({ topic: topics.driverLifecycle, fromBeginning: false });
await consumer.run({ eachMessage: async ({ message }) => {
  const event = JSON.parse(message.value.toString());
  await runIdempotently(redis, event.eventId, async () => {
    if (event.eventType === eventTypes.RideRequested) {
      await redis.incr(`city:${event.payload.cityId}:open-ride-requests`);
      const distanceKm = haversineKm(event.payload.pickup, event.payload.dropoff);
      const surgeMultiplier = await surgeForCity(event.payload.cityId);
      const baseCents = 325;
      const distanceCents = Math.ceil(distanceKm * 145);
      await Quote.updateOne({ rideId: event.payload.rideId }, { $set: { rideId: event.payload.rideId, cityId: event.payload.cityId, vehicleClass: event.payload.vehicleClass, baseCents, distanceCents, surgeMultiplier, totalCents: Math.ceil((baseCents + distanceCents) * surgeMultiplier) } }, { upsert: true });
    }
    if (event.eventType === eventTypes.RideCompleted || event.eventType === eventTypes.RideCancelled) {
      const quote = await Quote.findOne({ rideId: event.payload.rideId }).lean();
      if (quote?.cityId) await redis.decr(`city:${quote.cityId}:open-ride-requests`);
    }
    if (event.eventType === eventTypes.DriverOnline) {
      await redis.sadd(`city:${event.payload.cityId}:active-drivers`, event.payload.driverId);
    }
    if (event.eventType === eventTypes.DriverOffline) {
      await redis.srem(`city:${event.payload.cityId}:active-drivers`, event.payload.driverId);
    }
  });
}});

