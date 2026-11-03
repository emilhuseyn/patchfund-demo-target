import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "./helpers.js";

test("login only redirects to same-site paths", async () => {
  for (const next of ["https://evil.example/phish", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
    const r = await request(`/login?next=${encodeURIComponent(next)}`);
    assert.equal(r.location, "/", next);
  }
  assert.equal((await request("/login?next=%2Ffiles%3Fname%3Dreadme.txt")).location, "/files?name=readme.txt");
});
