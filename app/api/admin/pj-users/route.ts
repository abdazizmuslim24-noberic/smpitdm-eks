import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";

export async function GET() {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "staff.assign")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const pjUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(sql`${users.role} = 'PJ_GURU'`)
    .orderBy(sql`${users.name} asc`);

  return NextResponse.json({ users: pjUsers });
}
