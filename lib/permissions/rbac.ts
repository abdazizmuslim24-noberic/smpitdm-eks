import type { UserRole } from "@/db/schema";

/**
 * RBAC permission checks (server-side). See PRD sections 5 & 6.
 * These must be enforced on EVERY route handler / server action.
 */

export type Permission =
  | "users.manage"
  | "students.manage"
  | "students.view"
  | "extracurriculars.manage"
  | "staff.assign"
  | "memberships.manage"
  | "meetings.manage"
  | "attendance.manage"
  | "attendance.view"
  | "reports.view"
  | "payments.manage"
  | "payments.verify.all"
  | "payments.verify.scoped"
  | "payments.upload"
  | "receipts.view"
  | "receipts.generate";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "users.manage",
    "students.manage",
    "extracurriculars.manage",
    "staff.assign",
    "memberships.manage",
    "meetings.manage",
    "attendance.manage",
    "attendance.view",
    "reports.view",
    "payments.manage",
    "payments.verify.all",
    "payments.upload",
    "receipts.view",
    "receipts.generate",
  ],
  PJ_GURU: [
    "students.view",
    "memberships.manage",
    "meetings.manage",
    "attendance.manage",
    "attendance.view",
    "reports.view",
    "payments.manage",
    "payments.verify.scoped",
    "receipts.view",
    "receipts.generate",
  ],
  SISWA: [
    "attendance.view",
    "payments.upload",
    "receipts.view",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Ownership check for PJ_GURU: is this user assigned as staff of
 * the given extracurricular_id? Callers pass an async resolver so the
 * check works with the DB.
 */
export async function checkPJOwnership(
  role: UserRole,
  userId: string,
  extracurricularId: string,
  isAssigned: (userId: string, extracurricularId: string) => Promise<boolean>
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (role !== "PJ_GURU") return false;
  return isAssigned(userId, extracurricularId);
}
