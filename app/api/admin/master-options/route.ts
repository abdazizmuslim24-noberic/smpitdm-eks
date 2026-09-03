import { NextResponse } from "next/server";
import { sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { students, extracurriculars } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { getPjEkskulIds } from "@/lib/pj-scope";

export async function GET() {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "memberships.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const studentList = await db
    .select({
      id: students.id,
      name: students.name,
      nis: students.nis,
      className: students.className,
    })
    .from(students)
    .where(sql`${students.status} = 'AKTIF'`)
    .orderBy(sql`${students.name} asc`);

  let ekList;
  if (session.role === "PJ_GURU") {
    const ids = await getPjEkskulIds(session.sub);
    ekList =
      ids.length > 0
        ? await db
            .select({
              id: extracurriculars.id,
              name: extracurriculars.name,
              code: extracurriculars.code,
            })
            .from(extracurriculars)
            .where(inArray(extracurriculars.id, ids))
            .orderBy(sql`${extracurriculars.name} asc`)
        : [];
  } else {
    ekList = await db
      .select({
        id: extracurriculars.id,
        name: extracurriculars.name,
        code: extracurriculars.code,
      })
      .from(extracurriculars)
      .where(sql`${extracurriculars.status} = 'AKTIF'`)
      .orderBy(sql`${extracurriculars.name} asc`);
  }

  return NextResponse.json({ students: studentList, extracurriculars: ekList });
}
