import { check } from 'k6';
import http from 'k6/http';

const BASE = __ENV.API_BASE_URL || 'http://api:3000';

export const options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],          // <1% errors
    http_req_duration: ['p(95)<200'],        // p95 under 200ms
    checks: ['rate>0.99'],                   // 99% checks pass
  },
};

export default function () {
  const res = http.get(`${BASE}/v1/health`, {
    headers: { 'x-request-id': `k6-${__VU}-${__ITER}` },
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
}