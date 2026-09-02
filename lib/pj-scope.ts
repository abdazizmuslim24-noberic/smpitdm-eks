import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { extracurricularStaff } from "@/db/schema";

/**
 * Return the extracurricular ids a PJ_GURU is assigned to via
 * extracurricular_staff. Used to scope all PJ operations.
 */
export async function getPjEkskulIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: extracurricularStaff.extracurricularId })
    .from(extracurricularStaff)
    .where(eq(extracurricularStaff.userId, userId));
  return rows.map((r) => r.id);
}

/**
 * Check whether a PJ user is assigned to a specific extracurricular.
 * For server-side ownership verification (returns boolean; 403 by caller).
 */
export async function pjIsAssigned(
  userId: string,
  extracurricularId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: extracurricularStaff.id })
    .from(extracurricularStaff)
    .where(
      and(
        eq(extracurricularStaff.userId, userId),
        eq(extracurricularStaff.extracurricularId, extracurricularId)
      )
    )
    .limit(1);
  return rows.length > 0;
}
