import client from "prom-client";
import morgan from "morgan";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration by service, method, route and status.",
  labelNames: ["service", "method", "route", "status"],
  buckets: [0.005, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

export const domainCounters = new client.Counter({
  name: "domain_events_total",
  help: "Domain events processed by type and service.",
  labelNames: ["service", "event_type", "result"]
});

registry.registerMetric(httpRequestDuration);
registry.registerMetric(domainCounters);

export function startTracing(serviceName) {
  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
    instrumentations: [getNodeAutoInstrumentations()]
  });
  sdk.start();
  return sdk;
}

export function requestLogger() {
  return morgan('{"ts":":date[iso]","method":":method","url":":url","status":":status","durationMs":":response-time"}');
}

export function metricsHandler() {
  return async (_req, res) => {
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  };
}

