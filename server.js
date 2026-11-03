// tinyshare: a deliberately small file-sharing server used as the target of the Patch Fund demo.
// Its open issues are real security bugs; each one carries a bounty in the Patch Fund demo DAO on NEAR testnet.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { checkPreviewUrl } from "./preview-guard.js";

const UPLOADS = path.resolve("uploads");
const SESSIONS = new Map([["demo-session", { user: "alice", role: "owner" }]]);

function session(req) {
  const cookie = req.headers.cookie || "";
  const id = cookie.match(/sid=([\w-]+)/)?.[1];
  return id ? SESSIONS.get(id) : undefined;
}

export function handler(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/files" && req.method === "GET") {
    const name = url.searchParams.get("name") || "";
    const file = path.resolve(UPLOADS, name);
    // Only files inside uploads/: anything that resolves elsewhere is treated as missing.
    if (!file.startsWith(UPLOADS + path.sep) || !fs.existsSync(file)) return send(res, 404, "not found");
    return send(res, 200, fs.readFileSync(file));
  }

  if (url.pathname === "/files/delete" && req.method === "POST") {
    if (session(req)?.role !== "owner") return send(res, 401, "sign in as the owner to delete files");
    const name = url.searchParams.get("name") || "";
    fs.rmSync(path.join(UPLOADS, path.basename(name)), { force: true });
    return send(res, 200, "deleted");
  }

  if (url.pathname === "/preview" && req.method === "GET") {
    const target = url.searchParams.get("url");
    return checkPreviewUrl(target)
      .then((refused) => {
        if (refused) throw Object.assign(new Error(refused), { status: 400 });
        // No redirects: a public URL must not bounce the server to an internal one.
        return fetch(target, { redirect: "manual" });
      })
      .then((r) => (r.status >= 300 && r.status < 400 ? "redirect not followed" : r.text()))
      .then((t) => send(res, 200, t.slice(0, 500)))
      .catch((e) => send(res, e.status || 502, e.status ? e.message : "preview failed"));
  }

  if (url.pathname === "/login" && req.method === "GET") {
    const asked = url.searchParams.get("next") || "/";
    // Same-site paths only: "/x" is fine, "//evil.example" and "https://..." are not.
    const next = /^\/(?![\/\\])/.test(asked) ? asked : "/";
    res.writeHead(302, { Location: next, "Set-Cookie": "sid=demo-session; HttpOnly; Secure; SameSite=Lax; Path=/" });
    return res.end();
  }

  send(res, 404, "not found");
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(body);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  http.createServer(handler).listen(8080, () => console.log("tinyshare on http://localhost:8080"));
}
