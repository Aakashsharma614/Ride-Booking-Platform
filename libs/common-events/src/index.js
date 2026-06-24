import { Kafka } from "kafkajs";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const topics = Object.freeze({
  driverLifecycle: "driver.lifecycle.v1",
  driverLocation: "driver.location.v1",
  rideLifecycle: "ride.lifecycle.v1",
  paymentLifecycle: "payment.lifecycle.v1",
  notificationRequests: "notification.requests.v1",
  analyticsFacts: "analytics.facts.v1",
  deadLetters: "platform.dead-letter.v1"
});

export const eventTypes = Object.freeze({
  DriverOnline: "DriverOnline",
  DriverOffline: "DriverOffline",
  DriverLocationUpdated: "DriverLocationUpdated",
  RideRequested: "RideRequested",
  RideMatched: "RideMatched",
  RideAccepted: "RideAccepted",
  RideRejected: "RideRejected",
  RideStarted: "RideStarted",
  RideCompleted: "RideCompleted",
  RideCancelled: "RideCancelled",
  PaymentInitiated: "PaymentInitiated",
  PaymentCompleted: "PaymentCompleted",
  PaymentFailed: "PaymentFailed",
  NotificationRequested: "NotificationRequested"
});

const geoPoint = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.nativeEnum(eventTypes),
  eventVersion: z.literal(1),
  aggregateId: z.string().min(1),
  aggregateType: z.string().min(1),
  occurredAt: z.string().datetime(),
  correlationId: z.string().min(1),
  causationId: z.string().optional(),
  producer: z.string().min(1),
  payload: z.record(z.unknown())
});

export const payloadSchemas = {
  DriverOnline: z.object({ driverId: z.string(), vehicleClass: z.string(), cityId: z.string() }),
  DriverOffline: z.object({ driverId: z.string(), cityId: z.string() }),
  DriverLocationUpdated: z.object({ driverId: z.string(), cityId: z.string(), location: geoPoint, heading: z.number().optional(), speedKph: z.number().optional() }),
  RideRequested: z.object({ rideId: z.string(), riderId: z.string(), pickup: geoPoint, dropoff: geoPoint, cityId: z.string(), vehicleClass: z.string() }),
  RideMatched: z.object({ rideId: z.string(), riderId: z.string(), driverId: z.string(), ETASeconds: z.number().int().nonnegative() }),
  RideAccepted: z.object({ rideId: z.string(), driverId: z.string() }),
  RideRejected: z.object({ rideId: z.string(), driverId: z.string(), reason: z.string() }),
  RideStarted: z.object({ rideId: z.string(), driverId: z.string(), startedAt: z.string().datetime() }),
  RideCompleted: z.object({ rideId: z.string(), driverId: z.string(), fareCents: z.number().int().nonnegative() }),
  RideCancelled: z.object({ rideId: z.string(), cancelledBy: z.enum(["RIDER", "DRIVER", "SYSTEM"]), reason: z.string() }),
  PaymentInitiated: z.object({ paymentId: z.string(), rideId: z.string(), riderId: z.string(), amountCents: z.number().int().positive(), currency: z.string() }),
  PaymentCompleted: z.object({ paymentId: z.string(), rideId: z.string(), amountCents: z.number().int().positive(), currency: z.string() }),
  PaymentFailed: z.object({ paymentId: z.string(), rideId: z.string(), reason: z.string() }),
  NotificationRequested: z.object({ recipientId: z.string(), channel: z.enum(["PUSH", "EMAIL", "SMS"]), template: z.string(), data: z.record(z.unknown()) })
};

export function createEvent({ eventType, aggregateId, aggregateType, producer, payload, correlationId = randomUUID(), causationId }) {
  const payloadSchema = payloadSchemas[eventType];
  if (!payloadSchema) throw new Error(`Unsupported event type: ${eventType}`);
  const envelope = {
    eventId: randomUUID(),
    eventType,
    eventVersion: 1,
    aggregateId,
    aggregateType,
    occurredAt: new Date().toISOString(),
    correlationId,
    causationId,
    producer,
    payload: payloadSchema.parse(payload)
  };
  return eventEnvelopeSchema.parse(envelope);
}

export function topicForEvent(eventType) {
  if (eventType.startsWith("DriverLocation")) return topics.driverLocation;
  if (eventType.startsWith("Driver")) return topics.driverLifecycle;
  if (eventType.startsWith("Ride")) return topics.rideLifecycle;
  if (eventType.startsWith("Payment")) return topics.paymentLifecycle;
  if (eventType === eventTypes.NotificationRequested) return topics.notificationRequests;
  return topics.analyticsFacts;
}

export function createKafkaClient({ clientId, brokers = process.env.KAFKA_BROKERS?.split(",") ?? ["localhost:9092"] }) {
  return new Kafka({ clientId, brokers, retry: { retries: 8, initialRetryTime: 300 } });
}

export async function publishEvent(producer, event) {
  const validated = eventEnvelopeSchema.parse(event);
  await producer.send({
    topic: topicForEvent(validated.eventType),
    messages: [{ key: validated.aggregateId, value: JSON.stringify(validated), headers: { correlationId: validated.correlationId } }]
  });
}

