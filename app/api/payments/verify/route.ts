import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { payments, paymentReceipts } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { pjIsAssigned } from "@/lib/pj-scope";

const verifySchema = z.object({
  paymentId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.role !== "ADMIN" && session.role !== "PJ_GURU") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, parsed.data.paymentId))
    .limit(1);
  if (!payment) {
    return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
  }

  if (payment.status !== "MENUNGGU_VERIFIKASI") {
    return NextResponse.json({ error: "Pembayaran sudah diverifikasi." }, { status: 409 });
  }

  // RBAC: admin any; PJ only scoped to their assigned extracurricular
  if (session.role === "ADMIN") {
    if (!hasPermission(session.role, "payments.verify.all")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  } else {
    if (!hasPermission(session.role, "payments.verify.scoped")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const assigned = await pjIsAssigned(session.sub, payment.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  // Rejection requires a note
  if (parsed.data.action === "reject" && !parsed.data.note.trim()) {
    return NextResponse.json(
      { error: "Catatan penolakan wajib diisi." },
      { status: 400 }
    );
  }

  const newStatus = parsed.data.action === "approve" ? "LUNAS" : "DITOLAK";

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: newStatus,
        verificationNote: parsed.data.note.trim() || null,
        verifiedBy: session.sub,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Generate a receipt record only when LUNAS
    if (newStatus === "LUNAS") {
      const existingReceipt = await tx
        .select({ id: paymentReceipts.id })
        .from(paymentReceipts)
        .where(eq(paymentReceipts.paymentId, payment.id))
        .limit(1);
      if (existingReceipt.length === 0) {
        const receiptNumber =
          "RC-" + payment.id.slice(0, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
        await tx.insert(paymentReceipts).values({
          id: randomUUID(),
          paymentId: payment.id,
          receiptNumber,
          fileUrl: null,
          generatedAt: new Date(),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
