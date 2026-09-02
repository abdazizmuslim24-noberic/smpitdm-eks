import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { students, users, STUDENT_STATUS } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { hashPassword } from "@/lib/auth/password";

const STUDENT_EMAIL_DOMAIN =
  process.env.STUDENT_EMAIL_DOMAIN || "siswa.sch.id";
const DEFAULT_PASSWORD = process.env.STUDENT_DEFAULT_PASSWORD || "";

const createStudentSchema = z.object({
  nis: z.string().min(1, "NIS wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  gender: z.enum(["L", "P"]).optional().default("L"),
  className: z.string().optional().default(""),
  status: z.enum(STUDENT_STATUS).optional().default("AKTIF"),
});

const updateStudentSchema = createStudentSchema.extend({
  id: z.string().min(1),
});

async function assertAdmin(): Promise<boolean> {
  const session = await requireRole(["ADMIN"]);
  return hasPermission(session.role, "students.manage");
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nis, parsed.data.nis))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "NIS sudah terdaftar." }, { status: 409 });
  }

  const studentId = randomUUID();
  const autoAccount =
    parsed.data.status === "AKTIF" && DEFAULT_PASSWORD ? true : false;

  await db.transaction(async (tx) => {
    await tx.insert(students).values({
      id: studentId,
      nis: parsed.data.nis,
      name: parsed.data.name.trim(),
      gender: parsed.data.gender,
      className: parsed.data.className || null,
      status: parsed.data.status,
    });

    if (autoAccount) {
      const userId = randomUUID();
      await tx.insert(users).values({
        id: userId,
        name: parsed.data.name.trim(),
        email: `${parsed.data.nis}@${STUDENT_EMAIL_DOMAIN}`.toLowerCase(),
        passwordHash: hashPassword(DEFAULT_PASSWORD),
        role: "SISWA",
        isActive: 1,
      });
      await tx
        .update(students)
        .set({ userId, updatedAt: new Date() })
        .where(eq(students.id, studentId));
    }
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, parsed.data.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
  }

  const nisConflict = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nis, parsed.data.nis))
    .limit(1);
  if (nisConflict.length > 0 && nisConflict[0].id !== parsed.data.id) {
    return NextResponse.json({ error: "NIS sudah terdaftar." }, { status: 409 });
  }

  await db
    .update(students)
    .set({
      nis: parsed.data.nis,
      name: parsed.data.name.trim(),
      gender: parsed.data.gender,
      className: parsed.data.className || null,
      status: parsed.data.status,
      updatedAt: new Date(),
    })
    .where(eq(students.id, parsed.data.id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  await db.delete(students).where(eq(students.id, id));

  return NextResponse.json({ ok: true });
}
