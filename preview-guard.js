// Decides whether GET /preview may fetch a URL: http(s) only, and every address the host resolves to must be public.
import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_V4 = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

const v4ToInt = (ip) => ip.split(".").reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;

export function isPublicAddress(ip) {
  if (net.isIPv4(ip)) {
    const n = v4ToInt(ip);
    return !BLOCKED_V4.some(([base, bits]) => (n >>> (32 - bits)) === (v4ToInt(base) >>> (32 - bits)));
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) {
    // IPv4-mapped: the URL parser rewrites ::ffff:127.0.0.1 as ::ffff:7f00:1, so read both forms.
    const tail = v6.slice(7);
    if (net.isIPv4(tail)) return isPublicAddress(tail);
    const [hi, lo] = tail.split(":").map((h) => parseInt(h, 16));
    if (Number.isNaN(hi) || Number.isNaN(lo)) return false;
    return isPublicAddress([hi >> 8, hi & 255, lo >> 8, lo & 255].join("."));
  }
  return !(v6 === "::" || v6 === "::1" || v6.startsWith("fe80:") || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("ff"));
}

export async function checkPreviewUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return "not a URL";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "only http and https";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0) return "host does not resolve";
  if (!addresses.every(isPublicAddress)) return "address is not public";
  return null;
}
