import mongoose from "mongoose";
import { createEvent, eventTypes, topicForEvent } from "@ride/common-events";
import { roles, authenticate, requireRole } from "@ride/common-security";
import { asyncHandler, connectMongo, createRedis, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "ride-service";
const redis = createRedis();
const Ride = mongoose.model("Ride", new mongoose.Schema({
  riderId: { type: String, index: true },
  driverId: { type: String, index: true },
  cityId: { type: String, index: true },
  vehicleClass: String,
  pickup: { lat: Number, lng: Number },
  dropoff: { lat: Number, lng: Number },
  status: { type: String, enum: ["REQUESTED", "MATCHING", "DRIVER_ASSIGNED", "DRIVER_ARRIVED", "STARTED", "COMPLETED", "CANCELLED"], index: true },
  fareCents: Number
}, { timestamps: true }));
const Saga = mongoose.model("RideBookingSaga", new mongoose.Schema({
  rideId: { type: String, unique: true },
  state: { type: String, index: true },
  compensations: [String]
}, { timestamps: true }));
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_rides"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });

app.post("/rides", authenticate, requireRole(roles.RIDER), asyncHandler(async (req, res) => {
  const ride = await Ride.create({ ...req.body, riderId: req.user.sub, status: "REQUESTED" });
  await Saga.create({ rideId: ride.id, state: "RIDE_REQUESTED", compensations: ["cancelRide"] });
  await redis.set(`ride:${ride.id}`, JSON.stringify(ride), "EX", 3600);
  const event = createEvent({ eventType: eventTypes.RideRequested, aggregateId: ride.id, aggregateType: "Ride", producer: serviceName, payload: { rideId: ride.id, riderId: ride.riderId, pickup: ride.pickup, dropoff: ride.dropoff, cityId: ride.cityId, vehicleClass: ride.vehicleClass } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.status(202).json({ rideId: ride.id, status: ride.status });
}));

app.post("/rides/:id/start", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const ride = await Ride.findOneAndUpdate({ _id: req.params.id, driverId: req.user.sub, status: "DRIVER_ARRIVED" }, { status: "STARTED" }, { new: true });
  if (!ride) return res.status(404).json({ error: "ride_not_found_or_invalid_state" });
  await redis.set(`ride:${ride.id}`, JSON.stringify(ride), "EX", 3600);
  const event = createEvent({ eventType: eventTypes.RideStarted, aggregateId: ride.id, aggregateType: "Ride", producer: serviceName, payload: { rideId: ride.id, driverId: req.user.sub, startedAt: new Date().toISOString() } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.json(ride);
}));

app.post("/rides/:id/arrived", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const ride = await Ride.findOneAndUpdate({ _id: req.params.id, driverId: req.user.sub, status: "DRIVER_ASSIGNED" }, { status: "DRIVER_ARRIVED" }, { new: true });
  if (!ride) return res.status(404).json({ error: "ride_not_found_or_invalid_state" });
  await redis.set(`ride:${ride.id}`, JSON.stringify(ride), "EX", 3600);
  res.json(ride);
}));

app.post("/rides/:id/complete", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const ride = await Ride.findOneAndUpdate({ _id: req.params.id, driverId: req.user.sub, status: "STARTED" }, { status: "COMPLETED", fareCents: req.body.fareCents }, { new: true });
  if (!ride) return res.status(404).json({ error: "ride_not_found_or_invalid_state" });
  await redis.set(`ride:${ride.id}`, JSON.stringify(ride), "EX", 3600);
  const event = createEvent({ eventType: eventTypes.RideCompleted, aggregateId: ride.id, aggregateType: "Ride", producer: serviceName, payload: { rideId: ride.id, driverId: req.user.sub, fareCents: ride.fareCents } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.json(ride);
}));

app.post("/rides/:id/cancel", authenticate, asyncHandler(async (req, res) => {
  const cancellableStatuses = ["REQUESTED", "MATCHING", "DRIVER_ASSIGNED", "DRIVER_ARRIVED"];
  const filter = { _id: req.params.id, status: { $in: cancellableStatuses } };
  if (req.user.role === roles.RIDER) filter.riderId = req.user.sub;
  else if (req.user.role === roles.DRIVER) filter.driverId = req.user.sub;
  const ride = await Ride.findOneAndUpdate(filter, { status: "CANCELLED" }, { new: true });
  if (!ride) return res.status(404).json({ error: "ride_not_found_or_not_cancellable" });
  await redis.set(`ride:${ride.id}`, JSON.stringify(ride), "EX", 3600);
  const event = createEvent({ eventType: eventTypes.RideCancelled, aggregateId: ride.id, aggregateType: "Ride", producer: serviceName, payload: { rideId: ride.id, cancelledBy: req.user.role, reason: req.body.reason ?? "not_specified" } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.json(ride);
}));

// These specific routes MUST come before /rides/:id to avoid param collision
app.get("/rides/me/active", authenticate, requireRole(roles.RIDER), asyncHandler(async (req, res) => {
  const ride = await Ride.findOne({ riderId: req.user.sub, status: { $in: ["REQUESTED", "MATCHING", "DRIVER_ASSIGNED", "DRIVER_ARRIVED", "STARTED"] } }).sort({ createdAt: -1 });
  res.json(ride ?? null);
}));

app.get("/rides/driver/current", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const ride = await Ride.findOne({ driverId: req.user.sub, status: { $in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "STARTED"] } }).sort({ createdAt: -1 });
  res.json(ride ?? null);
}));

// Role-based list: rider → own rides, driver → own rides, admin → all
app.get("/rides", authenticate, asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const filter = {};
  if (req.user.role === roles.RIDER) filter.riderId = req.user.sub;
  else if (req.user.role === roles.DRIVER) filter.driverId = req.user.sub;
  if (req.query.status) filter.status = req.query.status;
  const [rides, total] = await Promise.all([
    Ride.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Ride.countDocuments(filter)
  ]);
  res.json({ rides, total, page, limit, pages: Math.ceil(total / limit) });
}));

app.get("/rides/:id", authenticate, asyncHandler(async (req, res) => {
  const cached = await redis.get(`ride:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "ride_not_found" });
  res.json(ride);
}));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8105, () => console.log(`${serviceName} listening`));
