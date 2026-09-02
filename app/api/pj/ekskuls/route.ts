import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";

export async function GET() {
  const user = await getCurrentUser();
  if (user.role !== "PJ_GURU") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  const ekskulIds = await getPjEkskulIds(user.id);
  const ekskuls =
    ekskulIds.length > 0
      ? await db
          .select({ id: extracurriculars.id, name: extracurriculars.name, code: extracurriculars.code })
          .from(extracurriculars)
          .where(inArray(extracurriculars.id, ekskulIds))
      : [];
  return NextResponse.json({ extracurriculars: ekskuls });
}
