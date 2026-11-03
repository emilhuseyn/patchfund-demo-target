import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { handler } from "../server.js";

test("session cookie is HttpOnly, Secure and SameSite=Lax", async () => {
  const server = http.createServer(handler);
  await new Promise((r) => server.listen(0, r));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/login`, { redirect: "manual" });
    const cookie = res.headers.get("set-cookie");
    for (const flag of ["HttpOnly", "Secure", "SameSite=Lax"]) assert.ok(cookie.includes(flag), flag);
  } finally {
    server.close();
  }
});
