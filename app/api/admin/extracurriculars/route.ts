import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { extracurriculars } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";

const IMAGE_MIME = new Set(["image/jpeg", "image/png"]);
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const createSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  day: z.string().optional().default(""),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  location: z.string().optional().default(""),
  monthlyFee: z.number().optional().default(0),
  bankName: z.string().optional().default(""),
  bankAccountNumber: z.string().optional().default(""),
  bankAccountHolder: z.string().optional().default(""),
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

async function saveQr(file: File | null): Promise<string | null> {
  if (!file || !(file instanceof File) || file.size === 0) {
    return null;
  }
  if (!IMAGE_MIME.has(file.type)) {
    throw new Error("Tipe file QR tidak diizinkan. Gunakan JPG atau PNG.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran file QR maksimal 5 MB.");
  }
  const ext = MIME_EXT[file.type] ?? "png";
  const safeName = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, safeName), buffer);
  return `/uploads/${safeName}`;
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = createSchema.safeParse({
    code: (form.get("code") as string) ?? "",
    name: (form.get("name") as string) ?? "",
    day: (form.get("day") as string) ?? "",
    startTime: (form.get("startTime") as string) ?? "",
    endTime: (form.get("endTime") as string) ?? "",
    location: (form.get("location") as string) ?? "",
    monthlyFee: Number(form.get("monthlyFee")) || 0,
    bankName: (form.get("bankName") as string) ?? "",
    bankAccountNumber: (form.get("bankAccountNumber") as string) ?? "",
    bankAccountHolder: (form.get("bankAccountHolder") as string) ?? "",
  });

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

  let qrCodeUrl: string | null = null;
  const qrFile = form.get("qr") as File | null;
  try {
    qrCodeUrl = await saveQr(qrFile);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    );
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
    bankName: parsed.data.bankName || null,
    bankAccountNumber: parsed.data.bankAccountNumber || null,
    bankAccountHolder: parsed.data.bankAccountHolder || null,
    qrCodeUrl,
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = updateSchema.safeParse({
    id: (form.get("id") as string) ?? "",
    code: (form.get("code") as string) ?? "",
    name: (form.get("name") as string) ?? "",
    day: (form.get("day") as string) ?? "",
    startTime: (form.get("startTime") as string) ?? "",
    endTime: (form.get("endTime") as string) ?? "",
    location: (form.get("location") as string) ?? "",
    monthlyFee: Number(form.get("monthlyFee")) || 0,
    bankName: (form.get("bankName") as string) ?? "",
    bankAccountNumber: (form.get("bankAccountNumber") as string) ?? "",
    bankAccountHolder: (form.get("bankAccountHolder") as string) ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const [target] = await db
    .select({ id: extracurriculars.id, qrCodeUrl: extracurriculars.qrCodeUrl })
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

  const qrFile = form.get("qr") as File | null;
  const removeQr = (form.get("removeQr") as string) === "true";

  let nextQr = target.qrCodeUrl;
  try {
    if (qrFile && qrFile.size > 0) {
      const saved = await saveQr(qrFile);
      if (saved) nextQr = saved;
    } else if (removeQr) {
      nextQr = null;
    }
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    );
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
      bankName: parsed.data.bankName || null,
      bankAccountNumber: parsed.data.bankAccountNumber || null,
      bankAccountHolder: parsed.data.bankAccountHolder || null,
      qrCodeUrl: nextQr,
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
