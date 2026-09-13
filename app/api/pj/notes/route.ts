import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  studentNotes,
  students,
  extracurriculars,
  users,
  memberships,
} from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { getPjEkskulIds, pjIsAssigned } from "@/lib/pj-scope";

const createSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  extracurricularId: z.string().min(1, "Ekstrakurikuler wajib dipilih"),
  category: z.enum(["PERKEMBANGAN", "PERLU_BIMBINGAN"]),
  aspect: z.string().min(1, "Aspek / kegiatan wajib diisi"),
  note: z.string().optional().default(""),
});

export async function GET() {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "notes.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const ekIds =
    session.role === "PJ_GURU" ? await getPjEkskulIds(session.sub) : null;

  const query = {
    id: studentNotes.id,
    category: studentNotes.category,
    aspect: studentNotes.aspect,
    note: studentNotes.note,
    createdAt: studentNotes.createdAt,
    studentName: students.name,
    nis: students.nis,
    className: students.className,
    ekName: extracurriculars.name,
    authorName: users.name,
  };

  const notes =
    ekIds && ekIds.length === 0
      ? []
      : await db
          .select(query)
          .from(studentNotes)
          .innerJoin(students, eq(studentNotes.studentId, students.id))
          .innerJoin(
            extracurriculars,
            eq(studentNotes.extracurricularId, extracurriculars.id)
          )
          .innerJoin(users, eq(studentNotes.createdBy, users.id))
          .where(ekIds ? inArray(studentNotes.extracurricularId, ekIds) : undefined)
          .orderBy(sql`${studentNotes.createdAt} desc`);

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "notes.manage")) {
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
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  if (session.role === "PJ_GURU") {
    const assigned = await pjIsAssigned(session.sub, parsed.data.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.studentId, parsed.data.studentId),
        eq(memberships.extracurricularId, parsed.data.extracurricularId),
        eq(memberships.status, "AKTIF")
      )
    )
    .limit(1);
  if (!membership) {
    return NextResponse.json(
      { error: "Siswa tidak terdaftar aktif di ekstrakurikuler ini." },
      { status: 400 }
    );
  }

  await db.insert(studentNotes).values({
    id: randomUUID(),
    studentId: parsed.data.studentId,
    extracurricularId: parsed.data.extracurricularId,
    category: parsed.data.category,
    aspect: parsed.data.aspect.trim(),
    note: parsed.data.note.trim() || "-",
    createdBy: session.sub,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "notes.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select({
      id: studentNotes.id,
      extracurricularId: studentNotes.extracurricularId,
    })
    .from(studentNotes)
    .where(eq(studentNotes.id, id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 404 });
  }

  if (session.role === "PJ_GURU") {
    const assigned = await pjIsAssigned(session.sub, target.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  await db.delete(studentNotes).where(eq(studentNotes.id, id));

  return NextResponse.json({ ok: true });
}