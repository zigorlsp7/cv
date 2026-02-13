import * as client from 'prom-client';

export const registry = new client.Registry();

// Default node/process metrics into the same registry
client.collectDefaultMetrics({ register: registry });
