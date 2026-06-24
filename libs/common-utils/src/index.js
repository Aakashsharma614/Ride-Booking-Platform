import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import Redis from "ioredis";
import { createKafkaClient, publishEvent } from "@ride/common-events";
import { metricsHandler, requestLogger } from "@ride/common-observability";

export async function connectMongo(uri = process.env.MONGO_URI) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { maxPoolSize: 25, serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}

export function createRedis(url = process.env.REDIS_URL ?? "redis://localhost:6379") {
  return new Redis(url, { maxRetriesPerRequest: 3, enableReadyCheck: true });
}

export function createServiceApp({ serviceName }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger());
  app.get("/healthz", (_req, res) => res.json({ service: serviceName, status: "ok" }));
  app.get("/readyz", (_req, res) => res.json({ service: serviceName, status: "ready" }));
  app.get("/metrics", metricsHandler());
  return app;
}

export const outboxSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    topic: { type: String, required: true },
    aggregateId: { type: String, required: true, index: true },
    event: { type: Object, required: true },
    status: { type: String, enum: ["PENDING", "PUBLISHED", "FAILED"], default: "PENDING", index: true },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export function outboxModelFor(serviceName) {
  return mongoose.models[`${serviceName}Outbox`] ?? mongoose.model(`${serviceName}Outbox`, outboxSchema);
}

export async function enqueueOutbox(Outbox, event, topic) {
  await Outbox.create({ eventId: event.eventId, aggregateId: event.aggregateId, event, topic });
}

export async function drainOutbox({ Outbox, producer, batchSize = 50 }) {
  const rows = await Outbox.find({ status: "PENDING", nextAttemptAt: { $lte: new Date() } }).sort({ createdAt: 1 }).limit(batchSize);
  for (const row of rows) {
    try {
      await publishEvent(producer, row.event);
      row.status = "PUBLISHED";
    } catch {
      row.attempts += 1;
      row.status = row.attempts >= 8 ? "FAILED" : "PENDING";
      row.nextAttemptAt = new Date(Date.now() + Math.min(60_000, 2 ** row.attempts * 250));
    }
    await row.save();
  }
}

export async function startOutboxPublisher({ serviceName, Outbox, intervalMs = 1000 }) {
  const kafka = createKafkaClient({ clientId: `${serviceName}-outbox` });
  const producer = kafka.producer({ allowAutoTopicCreation: false, idempotent: true });
  await producer.connect();
  const tick = () => drainOutbox({ Outbox, producer }).catch((error) => console.error(JSON.stringify({ service: serviceName, component: "outbox", error: error.message })));
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  await tick();
  return { producer, stop: async () => { clearInterval(timer); await producer.disconnect(); } };
}

export async function runIdempotently(redis, eventId, handler) {
  const key = `idempotency:event:${eventId}`;
  const acquired = await redis.set(key, "processing", "NX", "EX", 86400);
  if (!acquired) return { skipped: true };
  try {
    const result = await handler();
    await redis.set(key, "done", "XX", "EX", 604800);
    return { skipped: false, result };
  } catch (error) {
    await redis.del(key);
    throw error;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "not_found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode ?? 500;
  res.status(status).json({ error: err.code ?? "internal_error", message: status === 500 ? "Internal server error" : err.message });
}
