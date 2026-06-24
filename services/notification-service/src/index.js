import mongoose from "mongoose";
import { createEvent, createKafkaClient, eventTypes, topicForEvent, topics } from "@ride/common-events";
import { asyncHandler, connectMongo, createRedis, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, runIdempotently, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "notification-service";
const redis = createRedis();
const Notification = mongoose.model("Notification", new mongoose.Schema({
  recipientId: { type: String, index: true },
  channel: String,
  template: String,
  data: Object,
  status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], index: true }
}, { timestamps: true }));
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_notifications"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });

// Admin / open: paginated list of all notifications — must come before /:recipientId
app.get("/notifications", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const [notifications, total] = await Promise.all([
    Notification.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments({})
  ]);
  res.json({ notifications, total, page, limit });
}));

app.get("/notifications/:recipientId", asyncHandler(async (req, res) => res.json(await Notification.find({ recipientId: req.params.recipientId }).sort({ createdAt: -1 }).limit(100))));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8108, () => console.log(`${serviceName} listening`));

const kafka = createKafkaClient({ clientId: serviceName });
const consumer = kafka.consumer({ groupId: "notification-service-events" });
await consumer.connect();
await consumer.subscribe({ topic: topics.rideLifecycle, fromBeginning: false });
await consumer.subscribe({ topic: topics.paymentLifecycle, fromBeginning: false });
await consumer.run({ eachMessage: async ({ message }) => {
  const event = JSON.parse(message.value.toString());
  await runIdempotently(redis, event.eventId, async () => {
    const recipientId = event.payload.riderId ?? event.payload.driverId;
    if (!recipientId) return;
    const notification = await Notification.create({ recipientId, channel: "PUSH", template: event.eventType, data: event.payload, status: "QUEUED" });
    const requested = createEvent({ eventType: eventTypes.NotificationRequested, aggregateId: notification.id, aggregateType: "Notification", producer: serviceName, correlationId: event.correlationId, causationId: event.eventId, payload: { recipientId, channel: "PUSH", template: event.eventType, data: event.payload } });
    await enqueueOutbox(Outbox, requested, topicForEvent(requested.eventType));
  });
}});
