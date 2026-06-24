# Event Contracts

All events use the shared envelope from `libs/common-events`.

```json
{
  "eventId": "uuid",
  "eventType": "RideRequested",
  "eventVersion": 1,
  "aggregateId": "ride-id",
  "aggregateType": "Ride",
  "occurredAt": "2026-06-04T13:00:00.000Z",
  "correlationId": "uuid",
  "causationId": "uuid",
  "producer": "ride-service",
  "payload": {}
}
```

## Topics

| Topic | Events | Key | Retention |
| --- | --- | --- | --- |
| `driver.lifecycle.v1` | DriverOnline, DriverOffline | driverId | 7 days |
| `driver.location.v1` | DriverLocationUpdated | driverId | 24 hours |
| `ride.lifecycle.v1` | RideRequested, RideMatched, RideAccepted, RideRejected, RideStarted, RideCompleted, RideCancelled | rideId | 30 days |
| `payment.lifecycle.v1` | PaymentInitiated, PaymentCompleted, PaymentFailed | paymentId | 30 days |
| `notification.requests.v1` | NotificationRequested | recipientId | 7 days |
| `platform.dead-letter.v1` | Failed consumed events | eventId | 14 days |

## Partition Strategy

Ride lifecycle events are keyed by `rideId` so state transitions are ordered for each ride. Driver lifecycle and location events use `driverId` to keep driver availability ordered. Surge and analytics processors additionally project city-level state into Redis and Mongo.

