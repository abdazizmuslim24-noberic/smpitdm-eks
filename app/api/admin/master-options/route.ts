import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { students, extracurriculars } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";

export async function GET() {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "memberships.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const [studentList, ekList] = await Promise.all([
    db
      .select({ id: students.id, name: students.name, nis: students.nis })
      .from(students)
      .where(sql`${students.status} = 'AKTIF'`)
      .orderBy(sql`${students.name} asc`),
    db
      .select({ id: extracurriculars.id, name: extracurriculars.name, code: extracurriculars.code })
      .from(extracurriculars)
      .where(sql`${extracurriculars.status} = 'AKTIF'`)
      .orderBy(sql`${extracurriculars.name} asc`),
  ]);

  return NextResponse.json({ students: studentList, extracurriculars: ekList });
}
