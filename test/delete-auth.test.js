import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { request } from "./helpers.js";

test("delete needs the owner's session", async () => {
  fs.writeFileSync("uploads/tmp-delete.txt", "x");
  assert.equal((await request("/files/delete?name=tmp-delete.txt", { method: "POST" })).status, 401);
  assert.equal((await request("/files/delete?name=tmp-delete.txt", { method: "POST", cookie: "sid=nope" })).status, 401);
  assert.ok(fs.existsSync("uploads/tmp-delete.txt"));
  assert.equal((await request("/files/delete?name=tmp-delete.txt", { method: "POST", cookie: "sid=demo-session" })).status, 200);
  assert.ok(!fs.existsSync("uploads/tmp-delete.txt"));
});
