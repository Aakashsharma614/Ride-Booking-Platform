import mongoose from "mongoose";
import { createEvent, createKafkaClient, eventTypes, topicForEvent, topics } from "@ride/common-events";
import { authenticate } from "@ride/common-security";
import { asyncHandler, connectMongo, createRedis, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, runIdempotently, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "payment-service";
const redis = createRedis();
const Payment = mongoose.model("Payment", new mongoose.Schema({
  rideId: { type: String, index: true },
  riderId: { type: String, index: true },
  amountCents: Number,
  currency: String,
  status: { type: String, enum: ["INITIATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"], index: true }
}, { timestamps: true }));
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_payments"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });

// Must come before /payments/:rideId to avoid param collision
app.get("/payments/rider/me", authenticate, asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const [payments, total] = await Promise.all([
    Payment.find({ riderId: req.user.sub }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Payment.countDocuments({ riderId: req.user.sub })
  ]);
  res.json({ payments, total, page, limit });
}));

// Admin / open: paginated list of all payments
app.get("/payments", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  const [payments, total] = await Promise.all([
    Payment.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Payment.countDocuments({})
  ]);
  res.json({ payments, total, page, limit });
}));

app.get("/payments/:rideId", asyncHandler(async (req, res) => res.json(await Payment.find({ rideId: req.params.rideId }).sort({ createdAt: -1 }))));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8107, () => console.log(`${serviceName} listening`));

const kafka = createKafkaClient({ clientId: serviceName });
const consumer = kafka.consumer({ groupId: "payment-service-rides" });
await consumer.connect();
await consumer.subscribe({ topic: topics.rideLifecycle, fromBeginning: false });
await consumer.run({ eachMessage: async ({ message }) => {
  const event = JSON.parse(message.value.toString());
  await runIdempotently(redis, event.eventId, async () => {
    if (event.eventType === eventTypes.RideMatched) {
      const pricingUrl = process.env.PRICING_SERVICE_URL ?? "http://localhost:8106";
      const quoteRes = await fetch(`${pricingUrl}/pricing/quotes/${event.payload.rideId}`);
      const amountCents = quoteRes.ok ? (await quoteRes.json()).totalCents : 1000;
      const payment = await Payment.create({ rideId: event.payload.rideId, riderId: event.payload.riderId, amountCents, currency: "USD", status: "AUTHORIZED" });
      const completed = createEvent({ eventType: eventTypes.PaymentCompleted, aggregateId: payment.id, aggregateType: "Payment", producer: serviceName, correlationId: event.correlationId, causationId: event.eventId, payload: { paymentId: payment.id, rideId: payment.rideId, amountCents: payment.amountCents, currency: payment.currency } });
      await enqueueOutbox(Outbox, completed, topicForEvent(completed.eventType));
    }
    if (event.eventType === eventTypes.RideCancelled) await Payment.updateMany({ rideId: event.payload.rideId, status: "AUTHORIZED" }, { status: "REFUNDED" });
  });
}});
