import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { pjIsAssigned } from "@/lib/pj-scope";

const createSchema = z.object({
  extracurricularId: z.string().min(1),
  meetingDate: z.string().min(1, "Tanggal wajib diisi"),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  topic: z.string().min(1, "Topik wajib diisi"),
  location: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "meetings.manage")) {
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

  // PJ_GURU may only create meetings for assigned extracurriculars
  if (session.role === "PJ_GURU") {
    const assigned = await pjIsAssigned(session.sub, parsed.data.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  const meetingDate = new Date(parsed.data.meetingDate + "T00:00:00");

  await db.insert(meetings).values({
    id: randomUUID(),
    extracurricularId: parsed.data.extracurricularId,
    meetingDate,
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
    topic: parsed.data.topic.trim(),
    location: parsed.data.location || null,
    status: "DIJADWALKAN",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);
  if (!hasPermission(session.role, "meetings.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select({ id: meetings.id, extracurricularId: meetings.extracurricularId, status: meetings.status })
    .from(meetings)
    .where(eq(meetings.id, id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
  }

  // Only finished meetings can be deleted, to protect attendance history.
  if (target.status !== "SELESAI") {
    return NextResponse.json(
      { error: "Hanya pertemuan berstatus SELESAI yang dapat dihapus." },
      { status: 400 }
    );
  }

  // PJ_GURU may only delete meetings of their assigned extracurriculars.
  if (session.role === "PJ_GURU") {
    const assigned = await pjIsAssigned(session.sub, target.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  await db.delete(meetings).where(eq(meetings.id, id));

  return NextResponse.json({ ok: true });
}
