import mongoose from "mongoose";
import { createKafkaClient, topics } from "@ride/common-events";
import { asyncHandler, connectMongo, createRedis, createServiceApp, errorHandler, notFoundHandler, runIdempotently } from "@ride/common-utils";

const serviceName = "analytics-service";
const redis = createRedis();
const Fact = mongoose.model("AnalyticsFact", new mongoose.Schema({
  eventId: { type: String, unique: true },
  eventType: { type: String, index: true },
  aggregateId: { type: String, index: true },
  cityId: { type: String, index: true },
  amountCents: Number,
  occurredAt: { type: Date, index: true },
  payload: Object
}, { timestamps: true }));

await connectMongo((process.env.MONGO_URI ?? "mongodb://localhost:27017/ride_platform").replace("ride_platform", "ride_analytics"));
const app = createServiceApp({ serviceName });

app.get("/analytics/summary", asyncHandler(async (_req, res) => {
  const [rides, revenue] = await Promise.all([
    Fact.countDocuments({ eventType: "RideCompleted" }),
    Fact.aggregate([{ $match: { eventType: "RideCompleted" } }, { $group: { _id: null, total: { $sum: "$amountCents" } } }])
  ]);
  res.json({ completedRides: rides, revenueCents: revenue[0]?.total ?? 0 });
}));

app.get("/analytics/timeseries", asyncHandler(async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [daily, weekly] = await Promise.all([
    Fact.aggregate([
      { $match: { eventType: "RideCompleted", occurredAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, rides: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$amountCents", 0] } } } },
      { $sort: { _id: 1 } }
    ]),
    Fact.aggregate([
      { $match: { eventType: "RideCompleted", occurredAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, rides: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$amountCents", 0] } } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  res.json({ daily, weekly });
}));

app.get("/analytics/driver/:driverId/earnings", asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recent, daily] = await Promise.all([
    Fact.find({ eventType: "RideCompleted", "payload.driverId": driverId }).sort({ occurredAt: -1 }).limit(50),
    Fact.aggregate([
      { $match: { eventType: "RideCompleted", "payload.driverId": driverId, occurredAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, rides: { $sum: 1 }, earningsCents: { $sum: { $ifNull: ["$amountCents", 0] } } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  const totalCents = recent.reduce((s, f) => s + (f.amountCents ?? 0), 0);
  res.json({ totalCents, trips: recent.length, daily, recent: recent.slice(0, 20).map(f => ({ rideId: f.aggregateId, amountCents: f.amountCents, occurredAt: f.occurredAt })) });
}));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(process.env.PORT ?? 8109, () => console.log(`${serviceName} listening`));

const kafka = createKafkaClient({ clientId: serviceName });
const consumer = kafka.consumer({ groupId: "analytics-service-all-events" });
await consumer.connect();

// Retry subscribing until Kafka has auto-created the topics (may take a few seconds on first boot)
const kafkaTopics = [topics.driverLifecycle, topics.driverLocation, topics.rideLifecycle, topics.paymentLifecycle];
let subscribed = false;
for (let attempt = 1; attempt <= 15 && !subscribed; attempt++) {
  try {
    for (const topic of kafkaTopics) await consumer.subscribe({ topic, fromBeginning: false });
    subscribed = true;
  } catch (err) {
    console.warn(`Kafka topic subscription attempt ${attempt}/15 failed: ${err.message}. Retrying in 4s...`);
    await new Promise(r => setTimeout(r, 4000));
  }
}
if (!subscribed) throw new Error("Could not subscribe to Kafka topics after 15 attempts");

await consumer.run({ eachMessage: async ({ message }) => {
  const event = JSON.parse(message.value.toString());
  await runIdempotently(redis, event.eventId, async () => {
    await Fact.create({ eventId: event.eventId, eventType: event.eventType, aggregateId: event.aggregateId, cityId: event.payload.cityId, amountCents: event.payload.fareCents ?? event.payload.amountCents, occurredAt: event.occurredAt, payload: event.payload });
  });
}});
