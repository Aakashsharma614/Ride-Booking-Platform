import mongoose from "mongoose";
import { createEvent, eventTypes, topicForEvent } from "@ride/common-events";
import { roles, authenticate, requireRole } from "@ride/common-security";
import { asyncHandler, connectMongo, createRedis, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "location-service";
const redis = createRedis();
const LocationSample = mongoose.model("LocationSample", new mongoose.Schema({
  driverId: { type: String, index: true },
  cityId: { type: String, index: true },
  point: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: [Number] },
  heading: Number,
  speedKph: Number
}, { timestamps: true }));
LocationSample.schema.index({ point: "2dsphere" });
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_locations"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });

app.post("/drivers/me/location", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const { lat, lng, cityId, heading, speedKph } = req.body;
  await LocationSample.create({ driverId: req.user.sub, cityId, point: { coordinates: [lng, lat] }, heading, speedKph });
  await redis.geoadd(`geo:drivers:${cityId}`, lng, lat, req.user.sub);
  await redis.hset(`driver:${req.user.sub}:location`, { lat, lng, cityId, heading: heading ?? "", speedKph: speedKph ?? "", updatedAt: Date.now() });
  await redis.expire(`driver:${req.user.sub}:location`, 120);
  const event = createEvent({ eventType: eventTypes.DriverLocationUpdated, aggregateId: req.user.sub, aggregateType: "Driver", producer: serviceName, payload: { driverId: req.user.sub, cityId, location: { lat, lng }, heading, speedKph } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.status(202).json({ accepted: true });
}));

app.get("/drivers/nearby", authenticate, requireRole(roles.RIDER, roles.ADMIN), asyncHandler(async (req, res) => {
  const { cityId, lat, lng, radiusKm = 5 } = req.query;
  const drivers = await redis.geosearch(`geo:drivers:${cityId}`, "FROMLONLAT", Number(lng), Number(lat), "BYRADIUS", Number(radiusKm), "km", "WITHDIST", "COUNT", 20, "ASC");
  res.json(drivers.map(([driverId, distanceKm]) => ({ driverId, distanceKm: Number(distanceKm) })));
}));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8103, () => console.log(`${serviceName} listening`));
