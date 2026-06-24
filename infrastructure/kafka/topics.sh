#!/usr/bin/env bash
set -euo pipefail

broker="${KAFKA_BROKER:-localhost:9092}"

kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic driver.lifecycle.v1 --partitions 24 --replication-factor 1 --config retention.ms=604800000
kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic driver.location.v1 --partitions 48 --replication-factor 1 --config retention.ms=86400000
kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic ride.lifecycle.v1 --partitions 48 --replication-factor 1 --config retention.ms=2592000000
kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic payment.lifecycle.v1 --partitions 24 --replication-factor 1 --config retention.ms=2592000000
kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic notification.requests.v1 --partitions 12 --replication-factor 1 --config retention.ms=604800000
kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic analytics.facts.v1 --partitions 24 --replication-factor 1 --config retention.ms=2592000000
kafka-topics.sh --bootstrap-server "$broker" --create --if-not-exists --topic platform.dead-letter.v1 --partitions 12 --replication-factor 1 --config retention.ms=1209600000

