// scripts/stress.js — Cari batas maksimum sistem
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://test.k6.io";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "3m", target: 100 },
    { duration: "3m", target: 200 },
    { duration: "3m", target: 300 }, // Titik stress
    { duration: "3m", target: 400 }, // Breaking point?
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // Lebih longgar untuk stress test
    http_req_failed: ["rate<0.2"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);

  check(res, {
    "status OK": (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.5);
}
