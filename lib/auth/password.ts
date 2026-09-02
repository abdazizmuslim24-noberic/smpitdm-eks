import { randomBytes, scryptSync, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

/**
 * Password hashing using Node's built-in scrypt — no external dependency.
 * Format: scrypt$N$salt$hash  (all base64url)
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

/**
 * Async scrypt hash. Uses libuv threadpool so many hashes can be computed
 * in parallel (imports of many students). Matches hashPassword format.
 */
export async function hashPasswordAsync(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(
  password: string,
  stored: string
): boolean {
  try {
    const [scheme, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
