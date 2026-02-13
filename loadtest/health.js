import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  vus: 10,
  duration: "15s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<300"],
  },
};

export default function () {
  const res = http.get(`${__ENV.API_BASE_URL}/v1/health`, {
    headers: { "x-request-id": `k6-${__VU}-${__ITER}` },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(0.1);
}