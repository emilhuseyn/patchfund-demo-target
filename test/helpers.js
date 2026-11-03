import http from "node:http";
import { handler } from "../server.js";

export async function request(pathname, { method = "GET", cookie } = {}) {
  const server = http.createServer(handler);
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${pathname}`, { method, redirect: "manual", headers: cookie ? { cookie } : {} });
    return { status: res.status, location: res.headers.get("location"), body: await res.text() };
  } finally {
    server.close();
  }
}
