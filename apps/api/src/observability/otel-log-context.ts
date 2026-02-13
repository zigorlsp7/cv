import { context, trace } from '@opentelemetry/api';

export function getOtelIds() {
  const span = trace.getSpan(context.active());
  if (!span) return {};
  const sc = span.spanContext();
  return { traceId: sc.traceId, spanId: sc.spanId };
}
