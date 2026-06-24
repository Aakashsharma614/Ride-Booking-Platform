# Kafka Stream Processing In MERN

Node does not provide Kafka Streams as a first-party library. This implementation uses KafkaJS consumers as stream processors and stores state in Redis and MongoDB:

- Driver proximity: `location-service` writes Redis GEO by city.
- Nearest driver lookup: `matching-service` consumes RideRequested and queries Redis GEO.
- Availability aggregation: driver lifecycle events project active driver sets by city.
- Surge pricing: `pricing-service` combines active driver counts and open request counters.
- Real-time analytics: `analytics-service` consumes all lifecycle topics into Mongo facts.

State stores are explicitly external so processors can scale horizontally without local RocksDB recovery concerns. Kafka partition keys preserve per-aggregate ordering; Redis and Mongo provide shared materialized state.

