# MERN Ride Booking Platform

Production-oriented MERN implementation of a ride booking platform with microservices, Kafka eventing, MongoDB-owned service databases, Redis caches, CQRS read models, saga orchestration, outbox publishing, observability, Docker, Kubernetes, and CI/CD.

This replaces the original Java/Spring Boot stack with:

- MongoDB for service-owned persistence
- Express and Node.js for service APIs and workers
- React for the web operations console
- KafkaJS for event publishing, consumers, stream processors, and stateful aggregations
- Redis for geospatial driver state, rate limits, idempotency, and hot ride lookups

## Structure

```text
apps/web                  React operations console
services/api-gateway      JWT, RBAC, rate limiting, request routing
services/*-service        Domain microservices
libs/common-events        Event names, schemas, topics, publisher helpers
libs/common-security      JWT and RBAC helpers
libs/common-observability Metrics, logging, tracing bootstrap
libs/common-utils         Express, Mongo, Redis, outbox, idempotency helpers
infrastructure            Docker, Kafka topics, monitoring, Kubernetes
docs                      HLD, LLD, API contracts, event contracts, diagrams
```

## Run Locally

```bash
cp .env.example .env
npm install
docker compose -f infrastructure/docker-compose.yml up -d kafka mongo redis prometheus grafana jaeger
npm run dev:gateway
npm run dev:web
```

## Services

Each service owns its Mongo collections and publishes domain events through an outbox. Kafka workers drain outboxes and services consume events idempotently using Redis-backed event keys.

| Service | Port | Main responsibility |
| --- | ---: | --- |
| API gateway | 8080 | Auth, RBAC, rate limiting, routing |
| Rider | 8101 | Rider identity, profile, ride history |
| Driver | 8102 | Driver identity, verification, availability |
| Location | 8103 | GPS ingestion, Redis GEO indexes |
| Matching | 8104 | Nearest-driver matching and driver allocation |
| Ride | 8105 | Ride lifecycle and saga orchestration |
| Pricing | 8106 | Fare, surge, reservation quotes |
| Payment | 8107 | Payment reservation, capture, refunds |
| Notification | 8108 | Push, email, SMS dispatch requests |
| Analytics | 8109 | Real-time metrics and projections |
