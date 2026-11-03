import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "./helpers.js";

test("serves an uploaded file", async () => {
  const r = await request("/files?name=readme.txt");
  assert.equal(r.status, 200);
  assert.match(r.body, /hello from tinyshare/);
});
