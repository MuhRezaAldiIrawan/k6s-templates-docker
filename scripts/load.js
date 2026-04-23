// // scripts/load.js — Beban normal dengan stages
// import http from "k6/http";
// import { check, sleep, group } from "k6";
// import { Rate, Trend } from "k6/metrics";

// const BASE_URL = "http://localhost:8080/pos";

// // Custom metrics
// const errorRate = new Rate("error_rate");
// const pageLoad = new Trend("page_load_ms");

// export const options = {
//   stages: [
//     { duration: "1m", target: 10 }, // Ramp-up
//     { duration: "3m", target: 50 }, // Load normal
//     { duration: "1m", target: 100 }, // Peak load
//     { duration: "2m", target: 50 }, // Turun
//     { duration: "1m", target: 0 }, // Ramp-down
//   ],
//   thresholds: {
//     http_req_duration: ["p(90)<400", "p(95)<600"],
//     http_req_failed: ["rate<0.05"],
//     error_rate: ["rate<0.1"],
//   },
// };

// export default function () {
//   group("GET Homepage", () => {
//     const res = http.get(`${BASE_URL}/`, {
//       tags: { page: "home", type: "static" },
//     });

//     pageLoad.add(res.timings.duration);
//     const ok = check(res, {
//       "status 200": (r) => r.status === 200,
//       "load < 1000ms": (r) => r.timings.duration < 1000,
//     });
//     errorRate.add(!ok);
//     sleep(1);
//   });

//   // group("GET API contacts", () => {
//   //   const res = http.get(`${BASE_URL}/contacts.php`, {
//   //     tags: { page: "contacts", type: "api" },
//   //   });

//   //   check(res, {
//   //     "contacts status 200": (r) => r.status === 200,
//   //   });
//   //   sleep(1);
//   // });

//   // group("POST Login", () => {
//   //   const payload = JSON.stringify({
//   //     username: "admin",
//   //     password: "password",
//   //   });

//   //   const res = http.post(`${BASE_URL}/login.php`, payload, {
//   //     headers: { "Content-Type": "application/json" },
//   //     tags: { page: "login", type: "auth" },
//   //   });

//   //   check(res, {
//   //     "login response received": (r) => r.status !== 0,
//   //   });
//   //   sleep(2);
//   // });
// }

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "$2a$12$W9gfbONVgHvIuy4GbT7A3O1XD94gmJiaUWE/2IH.zBLpzhpF9VmzG";

const authHeaders = {
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
  },
};

const errorRate = new Rate("error_rate");
const pageLoad = new Trend("page_load_ms");

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Ramp-up
    { duration: "3m", target: 50 }, // Load normal
    { duration: "1m", target: 100 }, // Peak
    { duration: "2m", target: 50 }, // Turun
    { duration: "1m", target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(90)<400", "p(95)<600"],
    http_req_failed: ["rate<0.05"],
    error_rate: ["rate<0.1"],
  },
};

export default function () {
  group("Homepage", () => {
    const res = http.get(`${BASE_URL}/pos`, {
      ...authHeaders,
      tags: { page: "home", type: "static" },
    });
    pageLoad.add(res.timings.duration);
    const ok = check(res, {
      "status 200": (r) => r.status === 200,
      "load < 1000ms": (r) => r.timings.duration < 1000,
    });
    errorRate.add(!ok);
    sleep(1);
  });
}
