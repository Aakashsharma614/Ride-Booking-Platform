import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { createEvent, eventTypes, topicForEvent } from "@ride/common-events";
import { roles, signAccessToken, authenticate, requireRole } from "@ride/common-security";
import { asyncHandler, connectMongo, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "rider-service";
const Rider = mongoose.model("Rider", new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" }
}, { timestamps: true }));
const RideHistory = mongoose.model("RiderRideHistory", new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, index: true },
  rideId: { type: String, index: true },
  status: String,
  fareCents: Number
}, { timestamps: true }));
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_riders"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });

app.post("/riders/register", asyncHandler(async (req, res) => {
  const { email, password, name, phone } = req.body;
  const rider = await Rider.create({ email, passwordHash: await bcrypt.hash(password, 12), name, phone });
  res.status(201).json({ id: rider.id, email: rider.email, name: rider.name, phone: rider.phone });
}));

app.post("/riders/login", asyncHandler(async (req, res) => {
  const rider = await Rider.findOne({ email: req.body.email?.toLowerCase() });
  if (!rider || !(await bcrypt.compare(req.body.password ?? "", rider.passwordHash))) return res.status(401).json({ error: "invalid_credentials" });
  res.json({ accessToken: signAccessToken(rider.id, roles.RIDER, { email: rider.email }) });
}));

app.get("/riders/me", authenticate, requireRole(roles.RIDER, roles.ADMIN), asyncHandler(async (req, res) => {
  const rider = await Rider.findById(req.user.sub).select("-passwordHash");
  if (!rider) return res.status(404).json({ error: "rider_not_found" });
  res.json(rider);
}));

app.patch("/riders/me", authenticate, requireRole(roles.RIDER), asyncHandler(async (req, res) => {
  const rider = await Rider.findByIdAndUpdate(req.user.sub, { $set: { name: req.body.name, phone: req.body.phone } }, { new: true }).select("-passwordHash");
  if (!rider) return res.status(404).json({ error: "rider_not_found" });
  res.json(rider);
}));

app.get("/riders/me/rides", authenticate, requireRole(roles.RIDER), asyncHandler(async (req, res) => {
  res.json(await RideHistory.find({ riderId: req.user.sub }).sort({ createdAt: -1 }).limit(100));
}));

app.post("/riders/me/rides", authenticate, requireRole(roles.RIDER), asyncHandler(async (req, res) => {
  const rideId = randomUUID();
  const event = createEvent({
    eventType: eventTypes.RideRequested,
    aggregateId: rideId,
    aggregateType: "Ride",
    producer: serviceName,
    payload: { rideId, riderId: req.user.sub, ...req.body }
  });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.status(202).json({ rideId: event.payload.rideId, status: "REQUESTED", correlationId: event.correlationId });
}));

// Admin / open: paginated list of all riders
app.get("/riders", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [riders, total] = await Promise.all([
    Rider.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Rider.countDocuments(filter)
  ]);
  res.json({ riders, total, page, limit, pages: Math.ceil(total / limit) });
}));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8101, () => console.log(`${serviceName} listening`));
