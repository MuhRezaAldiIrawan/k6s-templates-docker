// scripts/smoke.js — Validasi dasar (1 VU, 1 menit)
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://test.k6.io";

export const options = {
  vus: 1,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);

  check(res, {
    "status 200": (r) => r.status === 200,
    "response < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
