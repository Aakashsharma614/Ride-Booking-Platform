import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createEvent, eventTypes, topicForEvent } from "@ride/common-events";
import { roles, signAccessToken, authenticate, requireRole } from "@ride/common-security";
import { asyncHandler, connectMongo, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "driver-service";
const Driver = mongoose.model("Driver", new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  cityId: { type: String, required: true, index: true },
  vehicle: { plate: String, make: String, model: String, class: String },
  verificationStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
  availability: { type: String, enum: ["ONLINE", "OFFLINE", "IN_RIDE"], default: "OFFLINE", index: true }
}, { timestamps: true }));
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_drivers"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });

app.post("/drivers/register", asyncHandler(async (req, res) => {
  const driver = await Driver.create({ ...req.body, passwordHash: await bcrypt.hash(req.body.password, 12), vehicle: req.body.vehicle });
  res.status(201).json({ id: driver.id, verificationStatus: driver.verificationStatus });
}));

app.post("/drivers/login", asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ email: req.body.email?.toLowerCase() });
  if (!driver || !(await bcrypt.compare(req.body.password ?? "", driver.passwordHash))) return res.status(401).json({ error: "invalid_credentials" });
  res.json({ accessToken: signAccessToken(driver.id, roles.DRIVER, { email: driver.email }) });
}));

// Must be before /drivers (list) to avoid param collision
app.get("/drivers/me", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.user.sub).select("-passwordHash");
  if (!driver) return res.status(404).json({ error: "driver_not_found" });
  res.json(driver);
}));

app.post("/drivers/me/online", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.user.sub);
  if (!driver) return res.status(404).json({ error: "driver_not_found" });
  if (driver.verificationStatus !== "APPROVED") return res.status(403).json({ error: "driver_not_approved" });
  await driver.updateOne({ availability: "ONLINE" });
  const event = createEvent({ eventType: eventTypes.DriverOnline, aggregateId: driver.id, aggregateType: "Driver", producer: serviceName, payload: { driverId: driver.id, vehicleClass: driver.vehicle?.class ?? "", cityId: driver.cityId } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.json({ availability: "ONLINE" });
}));

app.post("/drivers/me/offline", authenticate, requireRole(roles.DRIVER), asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.user.sub, { availability: "OFFLINE" }, { new: true });
  if (!driver) return res.status(404).json({ error: "driver_not_found" });
  const event = createEvent({ eventType: eventTypes.DriverOffline, aggregateId: driver.id, aggregateType: "Driver", producer: serviceName, payload: { driverId: driver.id, cityId: driver.cityId } });
  await enqueueOutbox(Outbox, event, topicForEvent(event.eventType));
  res.json({ availability: driver.availability });
}));

app.patch("/admin/drivers/:id/verification", authenticate, requireRole(roles.ADMIN), asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, { verificationStatus: req.body.status }, { new: true }).select("-passwordHash");
  if (!driver) return res.status(404).json({ error: "driver_not_found" });
  res.json(driver);
}));

// Admin / open: paginated list of all drivers
app.get("/drivers", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const filter = {};
  if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
  if (req.query.availability) filter.availability = req.query.availability;
  const [drivers, total] = await Promise.all([
    Driver.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Driver.countDocuments(filter)
  ]);
  res.json({ drivers, total, page, limit, pages: Math.ceil(total / limit) });
}));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8102, () => console.log(`${serviceName} listening`));
