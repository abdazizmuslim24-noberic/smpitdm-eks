import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds, pjIsAssigned } from "@/lib/pj-scope";

const IMAGE_MIME = new Set(["image/jpeg", "image/png"]);
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

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

const updateSchema = z.object({
  id: z.string().min(1),
  bankName: z.string().optional().default(""),
  bankAccountNumber: z.string().optional().default(""),
  bankAccountHolder: z.string().optional().default(""),
});

export async function GET() {
  const user = await getCurrentUser();
  if (user.role !== "PJ_GURU") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  const ekskulIds = await getPjEkskulIds(user.id);
  const ekskuls =
    ekskulIds.length > 0
      ? await db
          .select({
            id: extracurriculars.id,
            name: extracurriculars.name,
            code: extracurriculars.code,
            monthlyFee: extracurriculars.monthlyFee,
            bankName: extracurriculars.bankName,
            bankAccountNumber: extracurriculars.bankAccountNumber,
            bankAccountHolder: extracurriculars.bankAccountHolder,
            qrCodeUrl: extracurriculars.qrCodeUrl,
          })
          .from(extracurriculars)
          .where(inArray(extracurriculars.id, ekskulIds))
      : [];
  return NextResponse.json({ extracurriculars: ekskuls });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (user.role !== "PJ_GURU") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = updateSchema.safeParse({
    id: (form.get("id") as string) ?? "",
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

  const assigned = await pjIsAssigned(user.id, parsed.data.id);
  if (!assigned) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
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
      bankName: parsed.data.bankName || null,
      bankAccountNumber: parsed.data.bankAccountNumber || null,
      bankAccountHolder: parsed.data.bankAccountHolder || null,
      qrCodeUrl: nextQr,
    })
    .where(eq(extracurriculars.id, parsed.data.id));

  return NextResponse.json({ ok: true });
}
