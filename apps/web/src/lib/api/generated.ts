// Auto-generated from OpenAPI. Do not edit by hand.
// Source: artifacts/openapi.test.json

export type ApiOperation = {
  method: 'GET';
  path: '/';
  operationId: 'AppController_getHello';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/metrics';
  operationId: 'MetricsController_getMetrics';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/v1/health';
  operationId: 'HealthController_ok_v1';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/v1/health/live';
  operationId: 'HealthController_live_v1';
  responseCodes: ['200'];
} | {
  method: 'GET';
  path: '/v1/health/ready';
  operationId: 'HealthController_ready_v1';
  responseCodes: ['200'];
};

export const API_OPERATION_COUNT = 5 as const;

export const API_OPERATIONS = [
  {
    "method": "GET",
    "path": "/",
    "operationId": "AppController_getHello",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/metrics",
    "operationId": "MetricsController_getMetrics",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/health",
    "operationId": "HealthController_ok_v1",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/health/live",
    "operationId": "HealthController_live_v1",
    "responseCodes": [
      "200"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/health/ready",
    "operationId": "HealthController_ready_v1",
    "responseCodes": [
      "200"
    ]
  }
] as const;
