import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { TypeormInstrumentation } from '@opentelemetry/instrumentation-typeorm';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { config } from '../config/app.config';

const serviceName = config.otel.serviceName;
const endpoint = config.otel.endpoint;

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
    new TypeormInstrumentation(),
  ],
});

sdk.start();

let shutdownPromise: Promise<void> | undefined;

async function shutdown() {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = sdk.shutdown().catch(() => undefined);
  return shutdownPromise;
}

process.once('SIGTERM', () => {
  void shutdown();
});
process.once('SIGINT', () => {
  void shutdown();
});
