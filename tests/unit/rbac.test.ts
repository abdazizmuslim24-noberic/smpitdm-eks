import { describe, it, expect } from "vitest";
import {
  hasPermission,
  checkPJOwnership,
  type Permission,
} from "@/lib/permissions/rbac";
import type { UserRole } from "@/db/schema";

describe("RBAC hasPermission", () => {
  it("gives ADMIN full access via the verify.all permission", () => {
    expect(hasPermission("ADMIN", "payments.verify.all")).toBe(true);
    expect(hasPermission("ADMIN", "users.manage")).toBe(true);
    // .scoped is the PJ-only variant; ADMIN does not need it
    expect(hasPermission("ADMIN", "payments.verify.scoped")).toBe(false);
  });

  it("scopes PJ_GURU to payment verification of their own extracurricular only", () => {
    expect(hasPermission("PJ_GURU", "payments.verify.scoped")).toBe(true);
    expect(hasPermission("PJ_GURU", "payments.verify.all")).toBe(false);
  });

  it("does NOT give PJ_GURU user management", () => {
    expect(hasPermission("PJ_GURU", "users.manage")).toBe(false);
  });

  it("gives SISWA only read/own-data permissions", () => {
    expect(hasPermission("SISWA", "attendance.view")).toBe(true);
    expect(hasPermission("SISWA", "payments.upload")).toBe(true);
    expect(hasPermission("SISWA", "receipts.view")).toBe(true);
    expect(hasPermission("SISWA", "users.manage")).toBe(false);
    expect(hasPermission("SISWA", "attendance.manage")).toBe(false);
    expect(hasPermission("SISWA", "reports.view")).toBe(false);
  });

  it("covers every defined permission for at least one role", () => {
    const all: Permission[] = [
      "users.manage",
      "students.manage",
      "students.view",
      "extracurriculars.manage",
      "staff.assign",
      "memberships.manage",
      "meetings.manage",
      "attendance.manage",
      "attendance.view",
      "reports.view",
      "payments.manage",
      "payments.verify.all",
      "payments.verify.scoped",
      "payments.upload",
      "receipts.view",
      "receipts.generate",
    ];
    const roles: UserRole[] = ["ADMIN", "PJ_GURU", "SISWA"];
    for (const p of all) {
      const covered = roles.some((r) => hasPermission(r, p));
      expect(covered, `permission ${p} must be granted to at least one role`).toBe(true);
    }
  });
});

describe("checkPJOwnership", () => {
  const resolver = async (userId: string, ekId: string) =>
    userId === "pj-1" && ekId === "ek-futsal";

  it("allows ADMIN regardless of assignment", async () => {
    const ok = await checkPJOwnership("ADMIN", "any-user", "any-ek", resolver);
    expect(ok).toBe(true);
  });

  it("allows PJ only when assigned to the target extracurricular", async () => {
    expect(await checkPJOwnership("PJ_GURU", "pj-1", "ek-futsal", resolver)).toBe(true);
    expect(await checkPJOwnership("PJ_GURU", "pj-1", "ek-basket", resolver)).toBe(false);
    expect(await checkPJOwnership("PJ_GURU", "pj-2", "ek-futsal", resolver)).toBe(false);
  });

  it("denies SISWA always", async () => {
    expect(await checkPJOwnership("SISWA", "s1", "ek-futsal", resolver)).toBe(false);
  });
});
