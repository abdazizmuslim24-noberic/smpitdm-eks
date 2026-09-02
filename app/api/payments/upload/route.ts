import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  payments,
  memberships,
  extracurriculars,
  type PaymentMethod,
} from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { pjIsAssigned } from "@/lib/pj-scope";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const paymentSchema = z.object({
  extracurricularId: z.string().min(1),
  period: z.string().min(1),
  paymentMethod: z.enum(["TUNAI", "TRANSFER", "LAINNYA"]),
  amount: z.number().positive("Nominal harus lebih dari 0"),
  studentId: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const session = await requireSession();

  const form = await request.formData();
  const raw = {
    extracurricularId: (form.get("extracurricularId") as string) ?? "",
    period: (form.get("period") as string) ?? "",
    paymentMethod: ((form.get("paymentMethod") as string) ?? "TUNAI") as PaymentMethod,
    amount: Number(form.get("amount")) || 0,
    studentId: (form.get("studentId") as string) ?? "",
  };

  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  // Resolve acting student + validator
  let studentId: string;
  let actingUserIsVerified = false;

  if (session.role === "SISWA") {
    const student = await getStudentForUser(session.sub);
    if (!student) {
      return NextResponse.json(
        { error: "Profil siswa belum terhubung ke akun ini." },
        { status: 404 }
      );
    }
    studentId = student.id;
    // Must be a member of the selected extracurricular
    const membership = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.studentId, studentId),
          eq(memberships.extracurricularId, parsed.data.extracurricularId)
        )
      )
      .limit(1);
    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Anda tidak terdaftar di ekstrakurikuler ini." },
        { status: 403 }
      );
    }
    actingUserIsVerified = true;
  } else if (session.role === "ADMIN") {
    if (!parsed.data.studentId) {
      return NextResponse.json({ error: "Siswa wajib dipilih." }, { status: 400 });
    }
    studentId = parsed.data.studentId;
    actingUserIsVerified = true;
  } else {
    // PJ_GURU: must be assigned to the extracurricular
    if (!parsed.data.studentId) {
      return NextResponse.json({ error: "Siswa wajib dipilih." }, { status: 400 });
    }
    const assigned = await pjIsAssigned(session.sub, parsed.data.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    studentId = parsed.data.studentId;
    actingUserIsVerified = true;
  }

  if (!actingUserIsVerified) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  // Validate extracurricular exists
  const ek = await db
    .select({ id: extracurriculars.id })
    .from(extracurriculars)
    .where(eq(extracurriculars.id, parsed.data.extracurricularId))
    .limit(1);
  if (ek.length === 0) {
    return NextResponse.json({ error: "Ekstrakurikuler tidak ditemukan." }, { status: 404 });
  }

  // Optional proof file
  const file = form.get("proof");
  let proofFile: string | null = null;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak diizinkan. Gunakan JPG, PNG, atau PDF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB." }, { status: 400 });
    }

    const ext = MIME_EXT[file.type] ?? "bin";
    const safeName = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);
    proofFile = `/uploads/${safeName}`;
  }

  await db.insert(payments).values({
    id: randomUUID(),
    studentId,
    extracurricularId: parsed.data.extracurricularId,
    period: parsed.data.period,
    paymentDate: new Date(),
    amount: parsed.data.amount,
    paymentMethod: parsed.data.paymentMethod,
    proofFile,
    status: "MENUNGGU_VERIFIKASI",
    createdBy: session.sub,
  });

  return NextResponse.json({ ok: true });
}
