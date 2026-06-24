import test from "node:test";
import assert from "node:assert/strict";
import { createEvent, eventTypes, topicForEvent, topics } from "./index.js";

test("creates a valid ride requested envelope", () => {
  const event = createEvent({
    eventType: eventTypes.RideRequested,
    aggregateId: "ride-1",
    aggregateType: "Ride",
    producer: "test",
    payload: {
      rideId: "ride-1",
      riderId: "rider-1",
      cityId: "nyc",
      vehicleClass: "standard",
      pickup: { lat: 40.7, lng: -74 },
      dropoff: { lat: 40.8, lng: -73.9 }
    }
  });
  assert.equal(event.eventVersion, 1);
  assert.equal(topicForEvent(event.eventType), topics.rideLifecycle);
});

