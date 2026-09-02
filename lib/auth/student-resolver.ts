import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";

/**
 * Resolve the student record for a user (SISWA role). Returns null if none.
 * Used to scope "own data" queries server-side. Callers must handle null.
 */
export async function getStudentForUser(userId: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);

  return student ?? null;
}
