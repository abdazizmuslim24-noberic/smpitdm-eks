import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { extracurriculars } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";

const createSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  day: z.string().optional().default(""),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  location: z.string().optional().default(""),
  monthlyFee: z.number().optional().default(0),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1),
});

async function assertAdmin() {
  const session = await requireRole(["ADMIN"]);
  if (!hasPermission(session.role, "extracurriculars.manage")) {
    return null;
  }
  return session;
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const code = parsed.data.code.trim().toUpperCase();
  const existing = await db
    .select({ id: extracurriculars.id })
    .from(extracurriculars)
    .where(eq(extracurriculars.code, code))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Kode sudah digunakan." }, { status: 409 });
  }

  await db.insert(extracurriculars).values({
    id: randomUUID(),
    code,
    name: parsed.data.name.trim(),
    day: parsed.data.day || null,
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
    location: parsed.data.location || null,
    monthlyFee: parsed.data.monthlyFee,
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: extracurriculars.id })
    .from(extracurriculars)
    .where(eq(extracurriculars.id, parsed.data.id))
    .limit(1);
  if (!target) {
    return NextResponse.json(
      { error: "Ekstrakurikuler tidak ditemukan." },
      { status: 404 }
    );
  }

  const code = parsed.data.code.trim().toUpperCase();
  const codeConflict = await db
    .select({ id: extracurriculars.id })
    .from(extracurriculars)
    .where(eq(extracurriculars.code, code))
    .limit(1);
  if (codeConflict.length > 0 && codeConflict[0].id !== parsed.data.id) {
    return NextResponse.json({ error: "Kode sudah digunakan." }, { status: 409 });
  }

  await db
    .update(extracurriculars)
    .set({
      code,
      name: parsed.data.name.trim(),
      day: parsed.data.day || null,
      startTime: parsed.data.startTime || null,
      endTime: parsed.data.endTime || null,
      location: parsed.data.location || null,
      monthlyFee: parsed.data.monthlyFee,
    })
    .where(eq(extracurriculars.id, parsed.data.id));

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

  await db.delete(extracurriculars).where(eq(extracurriculars.id, id));

  return NextResponse.json({ ok: true });
}
