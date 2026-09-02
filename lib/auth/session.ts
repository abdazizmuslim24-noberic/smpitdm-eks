import { createHmac, timingSafeEqual } from "crypto";

/**
 * Lightweight stateless session: a signed token cookie.
 *   payload = base64url(JSON { sub, exp })
 *   signature = HMAC-SHA256(payload, AUTH_SECRET)
 *   cookie = `${payload}.${signature}`
 *
 * For MVP this avoids a session table. Production may swap to a library.
 */

const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
const SESSION_COOKIE_NAME = "eks_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export { SESSION_COOKIE_NAME };

function b64urlEncode(data: string): string {
  return Buffer.from(data, "utf8").toString("base64url");
}

function b64urlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface SessionPayload {
  sub: string; // user id
  email: string;
  role: "ADMIN" | "PJ_GURU" | "SISWA";
  exp: number;
}

export function createSessionToken(
  sub: string,
  email: string,
  role: SessionPayload["role"]
): string {
  const payload = b64urlEncode(
    JSON.stringify({
      sub,
      email,
      role,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined
): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(b64urlDecode(payload)) as SessionPayload;
    if (!data.sub || !data.role) return null;
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
