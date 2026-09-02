import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { extracurricularStaff } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";

const assignSchema = z.object({
  extracurricularId: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!hasPermission(session.role, "staff.assign")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(extracurricularStaff)
    .where(
      and(
        eq(extracurricularStaff.extracurricularId, parsed.data.extracurricularId),
        eq(extracurricularStaff.userId, parsed.data.userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "PJ sudah ditugaskan ke ekstrakurikuler ini." }, { status: 409 });
  }

  await db.insert(extracurricularStaff).values({
    id: randomUUID(),
    extracurricularId: parsed.data.extracurricularId,
    userId: parsed.data.userId,
  });

  return NextResponse.json({ ok: true });
}
