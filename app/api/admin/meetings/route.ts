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

const updateSchema = z.object({
  id: z.string().min(1),
  extracurricularId: z.string().min(1),
  meetingDate: z.string().min(1, "Tanggal wajib diisi"),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  topic: z.string().min(1, "Topik wajib diisi"),
  location: z.string().optional().default(""),
  status: z
    .enum(["DIJADWALKAN", "BERLANGSUNG", "SELESAI", "DIBATALKAN"])
    .default("DIJADWALKAN"),
});

const VALID_STATUS = ["DIJADWALKAN", "BERLANGSUNG", "SELESAI", "DIBATALKAN"];

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

export async function PUT(request: Request) {
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  if (!VALID_STATUS.includes(parsed.data.status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const [target] = await db
    .select({ id: meetings.id, extracurricularId: meetings.extracurricularId })
    .from(meetings)
    .where(eq(meetings.id, parsed.data.id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
  }

  // PJ_GURU may only edit meetings of their assigned extracurriculars.
  if (session.role === "PJ_GURU") {
    const assigned = await pjIsAssigned(session.sub, parsed.data.extracurricularId);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  const meetingDate = new Date(parsed.data.meetingDate + "T00:00:00");

  await db
    .update(meetings)
    .set({
      extracurricularId: parsed.data.extracurricularId,
      meetingDate,
      startTime: parsed.data.startTime || null,
      endTime: parsed.data.endTime || null,
      topic: parsed.data.topic.trim(),
      location: parsed.data.location || null,
      status: parsed.data.status,
    })
    .where(eq(meetings.id, parsed.data.id));

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
    .select({ id: meetings.id, extracurricularId: meetings.extracurricularId })
    .from(meetings)
    .where(eq(meetings.id, id))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
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
