import http from "k6/http";
import { check, sleep } from "k6";

// Run only against an authorized staging deployment:
// k6 run -e BASE_URL=https://staging.example.com -e AUTH_TOKEN=... load-tests/staged-smoke.js
const baseUrl = __ENV.BASE_URL;
const token = __ENV.AUTH_TOKEN;
if (!baseUrl || !token) throw new Error("BASE_URL and AUTH_TOKEN are required. Never run this against production without approval.");

const targetVus = Number(__ENV.TARGET_VUS || 100);
export const options = {
  stages: [
    { duration: "1m", target: Math.min(targetVus, 25) },
    { duration: "2m", target: targetVus },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: "auth_me" },
  });
  check(response, {
    "authenticated response": (res) => res.status === 200,
    "no server error": (res) => res.status < 500,
  });
  sleep(1);
}
