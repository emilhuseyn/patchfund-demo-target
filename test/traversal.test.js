import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "./helpers.js";

test("refuses paths that leave uploads/", async () => {
  for (const name of ["../package.json", "..%2fpackage.json", "/etc/hostname", "sub/../../server.js"]) {
    const r = await request(`/files?name=${name}`);
    assert.equal(r.status, 404, name);
  }
});

test("still serves files inside uploads/", async () => {
  assert.equal((await request("/files?name=readme.txt")).status, 200);
});
