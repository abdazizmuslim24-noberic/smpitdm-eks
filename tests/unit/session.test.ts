import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

describe("session token", () => {
  it("round-trips a valid session", () => {
    const token = createSessionToken("user-1", "a@b.c", "ADMIN");
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-1");
    expect(payload?.email).toBe("a@b.c");
    expect(payload?.role).toBe("ADMIN");
    expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("returns null for missing token", () => {
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken(null as unknown as string)).toBeNull();
  });

  it("rejects a tampered payload (signature mismatch)", () => {
    const token = createSessionToken("user-1", "a@b.c", "SISWA");
    const idx = token.indexOf("."); // end of the payload segment
    const char = token[idx - 1];
    const replacement = char === "A" ? "B" : "A";
    const tampered = token.slice(0, idx - 1) + replacement + token.slice(idx);
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("exposes a stable cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("eks_session");
  });
});
