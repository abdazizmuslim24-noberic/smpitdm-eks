import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies the correct password", () => {
    const hash = hashPassword("secret123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("secret123");
    expect(verifyPassword("wrongpass", hash)).toBe(false);
  });

  it("produces a different salt per hash", () => {
    const a = hashPassword("same");
    const b = hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("returns false for a malformed stored value", () => {
    expect(verifyPassword("x", "not-a-valid-hash")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "scrypt$abc")).toBe(false);
  });
});
