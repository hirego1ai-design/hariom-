import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import { POST } from "../app/api/auth/logout/route";

test("malformed session cookie can be logged out without database access", async () => {
  const response = await POST(new Request("http://localhost/api/auth/logout", {
    method: "POST", headers: { cookie: "hirego_session=invalid-token" },
  }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") || "", /hirego_session=;/);
  assert.match(response.headers.get("set-cookie") || "", /Expires=Thu, 01 Jan 1970/i);
});

test("expired session cookie is cleared without attempting revocation", async () => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "hirego_dev_only_jwt_secret_key_2026";
  const token = jwt.sign({ id: "expired-test-user", jti: "expired-test-session" }, secret, { expiresIn: -60 });
  const response = await POST(new Request("http://localhost/api/auth/logout", {
    method: "POST", headers: { cookie: `hirego_session=${token}` },
  }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") || "", /hirego_session=;/);
});
