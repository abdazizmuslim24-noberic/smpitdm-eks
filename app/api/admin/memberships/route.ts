import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { memberships, MEMBERSHIP_STATUS, extracurricularStaff } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission, checkPJOwnership } from "@/lib/permissions/rbac";

const createSchema = z.object({
  studentId: z.string().min(1),
  extracurricularId: z.string().min(1),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1),
  status: z.enum(MEMBERSHIP_STATUS).optional(),
});

type SessionShape = {
  role: "ADMIN" | "PJ_GURU" | "SISWA";
  id: string;
};

async function assertAccess(): Promise<SessionShape | null> {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "memberships.manage")) return null;
  return { role: session.role, id: session.sub };
}

async function canManage(pSession: SessionShape, extracurricularId: string): Promise<boolean> {
  return checkPJOwnership(
    pSession.role,
    pSession.id,
    extracurricularId,
    async (userId, ekId) => {
      const rows = await db
        .select({ id: extracurricularStaff.id })
        .from(extracurricularStaff)
        .where(
          and(
            eq(extracurricularStaff.userId, userId),
            eq(extracurricularStaff.extracurricularId, ekId)
          )
        )
        .limit(1);
      return rows.length > 0;
    }
  );
}

export async function POST(request: Request) {
  const session = await assertAccess();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  if (!(await canManage(session, parsed.data.extracurricularId))) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const duplicate = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.studentId, parsed.data.studentId),
        eq(memberships.extracurricularId, parsed.data.extracurricularId)
      )
    )
    .limit(1);
  if (duplicate.length > 0) {
    return NextResponse.json(
      { error: "Siswa sudah terdaftar di ekstrakurikuler ini." },
      { status: 409 }
    );
  }

  await db.insert(memberships).values({
    id: randomUUID(),
    studentId: parsed.data.studentId,
    extracurricularId: parsed.data.extracurricularId,
    status: "AKTIF",
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const session = await assertAccess();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.id, parsed.data.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Keanggotaan tidak ditemukan." }, { status: 404 });
  }

  const extracurricularId = parsed.data.extracurricularId;
  if (!(await canManage(session, extracurricularId))) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const movingToAnotherEk =
    target.extracurricularId !== extracurricularId || target.studentId !== parsed.data.studentId;
  if (movingToAnotherEk) {
    const conflict = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.studentId, parsed.data.studentId),
          eq(memberships.extracurricularId, extracurricularId)
        )
      )
      .limit(1);
    if (conflict.length > 0 && conflict[0].id !== parsed.data.id) {
      return NextResponse.json(
        { error: "Siswa sudah terdaftar di ekstrakurikuler ini." },
        { status: 409 }
      );
    }
  }

  await db
    .update(memberships)
    .set({
      studentId: parsed.data.studentId,
      extracurricularId,
      status: parsed.data.status ?? target.status,
      updatedAt: new Date(),
    })
    .where(eq(memberships.id, parsed.data.id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await assertAccess();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.id, id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Keanggotaan tidak ditemukan." }, { status: 404 });
  }

  if (!(await canManage(session, target.extracurricularId))) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  await db.delete(memberships).where(eq(memberships.id, id));

  return NextResponse.json({ ok: true });
}
