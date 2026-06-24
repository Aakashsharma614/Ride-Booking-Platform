import mongoose from "mongoose";
import { createEvent, createKafkaClient, eventTypes, topicForEvent, topics } from "@ride/common-events";
import { asyncHandler, connectMongo, createRedis, createServiceApp, enqueueOutbox, errorHandler, notFoundHandler, outboxModelFor, runIdempotently, startOutboxPublisher } from "@ride/common-utils";

const serviceName = "matching-service";
const redis = createRedis();
const MatchAttempt = mongoose.model("MatchAttempt", new mongoose.Schema({
  rideId: { type: String, index: true },
  riderId: String,
  driverId: String,
  cityId: String,
  status: { type: String, enum: ["ASSIGNED", "NO_DRIVER", "REJECTED"], index: true },
  distanceKm: Number,
  latencyMs: Number
}, { timestamps: true }));
const Outbox = outboxModelFor(serviceName);

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_matching"));
await startOutboxPublisher({ serviceName, Outbox });
const app = createServiceApp({ serviceName });
app.get("/matching/attempts/:rideId", asyncHandler(async (req, res) => res.json(await MatchAttempt.find({ rideId: req.params.rideId }).sort({ createdAt: -1 }))));
app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8104, () => console.log(`${serviceName} listening`));

const kafka = createKafkaClient({ clientId: serviceName });
const consumer = kafka.consumer({ groupId: "matching-service-rides" });
await consumer.connect();
await consumer.subscribe({ topic: topics.rideLifecycle, fromBeginning: false });
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    if (event.eventType !== eventTypes.RideRequested) return;
    await runIdempotently(redis, event.eventId, async () => {
      const started = Date.now();
      const { rideId, riderId, cityId, pickup } = event.payload;
      const candidates = await redis.geosearch(`geo:drivers:${cityId}`, "FROMLONLAT", pickup.lng, pickup.lat, "BYRADIUS", 8, "km", "WITHDIST", "COUNT", 10, "ASC");
      const available = candidates.find(([driverId]) => driverId);
      if (!available) {
        await MatchAttempt.create({ rideId, riderId, cityId, status: "NO_DRIVER", latencyMs: Date.now() - started });
        return;
      }
      const [driverId, distanceKm] = available;
      await redis.sadd(`ride:${rideId}:candidate-drivers`, driverId);
      await MatchAttempt.create({ rideId, riderId, driverId, cityId, status: "ASSIGNED", distanceKm: Number(distanceKm), latencyMs: Date.now() - started });
      const matched = createEvent({ eventType: eventTypes.RideMatched, aggregateId: rideId, aggregateType: "Ride", producer: serviceName, correlationId: event.correlationId, causationId: event.eventId, payload: { rideId, riderId, driverId, ETASeconds: Math.ceil(Number(distanceKm) / 0.5 * 60) } });
      await enqueueOutbox(Outbox, matched, topicForEvent(matched.eventType));
    });
  }
});
