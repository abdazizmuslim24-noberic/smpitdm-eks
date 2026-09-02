import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { hashPassword } from "@/lib/auth/password";

const schema = z.object({
  id: z.string().min(1),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Password tidak valid." },
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

  await db
    .update(users)
    .set({
      passwordHash: hashPassword(parsed.data.password),
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.id));

  return NextResponse.json({ ok: true });
}