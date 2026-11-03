import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "./helpers.js";
import { isPublicAddress } from "../preview-guard.js";

test("preview refuses internal and non-http targets", async () => {
  for (const target of ["http://127.0.0.1:1/", "http://localhost/", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.5/",
    "http://[::1]/", "http://[::ffff:127.0.0.1]/", "file:///etc/hostname", "ftp://example.com/", "not a url"]) {
    const r = await request(`/preview?url=${encodeURIComponent(target)}`);
    assert.equal(r.status, 400, target);
  }
});

test("address classification", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "fe80::1", "fd00::1", "::ffff:7f00:1", "::ffff:a9fe:a9fe"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  for (const ip of ["93.184.216.34", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(ip), true, ip);
});
