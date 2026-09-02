import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, USER_ROLES, type UserRole } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { hashPassword } from "@/lib/auth/password";

const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  role: z.enum(USER_ROLES),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(USER_ROLES),
});

async function assertAdmin(): Promise<boolean> {
  const session = await requireRole(["ADMIN"]);
  return hasPermission(session.role, "users.manage");
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

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Email sudah terdaftar." },
      { status: 409 }
    );
  }

  await db.insert(users).values({
    id: randomUUID(),
    name: parsed.data.name.trim(),
    email,
    passwordHash: hashPassword(parsed.data.password),
    role: parsed.data.role as UserRole,
    isActive: 1,
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

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, parsed.data.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const emailConflict = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (emailConflict.length > 0 && emailConflict[0].id !== parsed.data.id) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name.trim(),
      email,
      role: parsed.data.role as UserRole,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.id));

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = z.object({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, parsed.data.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  await db
    .update(users)
    .set({ isActive: target.isActive === 1 ? 0 : 1, updatedAt: new Date() })
    .where(eq(users.id, parsed.data.id));

  return NextResponse.json({ ok: true, isActive: target.isActive === 1 ? 0 : 1 });
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({ ok: true });
}