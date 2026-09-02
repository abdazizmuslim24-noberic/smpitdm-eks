import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  meetings,
  memberships,
  students,
  extracurricularStaff,
  attendance,
} from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import { checkPJOwnership } from "@/lib/permissions/rbac";

async function resolveMeeting(meetingId: string) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);
  return meeting;
}

export async function GET(request: Request) {
  const session = await requireSession();
  const url = new URL(request.url);
  const meetingId = url.searchParams.get("meeting") ?? "";

  if (!meetingId) {
    return NextResponse.json({ error: "Param pertemuan wajib." }, { status: 400 });
  }

  const meeting = await resolveMeeting(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
  }

  // Ownership check for PJ_GURU
  if (session.role === "PJ_GURU") {
    const allowed = await checkPJOwnership(
      session.role,
      session.sub,
      meeting.extracurricularId,
      async (userId, ekId) => {
        const rows = await db
          .select({ id: extracurricularStaff.id })
          .from(extracurricularStaff)
          .where(
            and(
              eq(extracurricularStaff.userId, userId),
              eq(extracurricularStaff.extracurricularId, ekId)
            )
          )
          .limit(1);
        return rows.length > 0;
      }
    );
    if (!allowed) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  // Students (members) with current attendance
  const members = await db
    .select({
      id: students.id,
      name: students.name,
      nis: students.nis,
    })
    .from(memberships)
    .innerJoin(students, eq(memberships.studentId, students.id))
    .where(
      and(
        eq(memberships.extracurricularId, meeting.extracurricularId),
        eq(memberships.status, "AKTIF")
      )
    )
    .orderBy(students.name);

  const memberIds = members.map((m) => m.id);

  const existing =
    memberIds.length > 0
      ? await db
          .select()
          .from(attendance)
          .where(
            and(eq(attendance.meetingId, meeting.id), inArray(attendance.studentId, memberIds))
          )
      : [];

  const statusById = new Map<string, string>();
  for (const a of existing) {
    statusById.set(a.studentId, a.status);
  }

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      topic: meeting.topic,
      date: meeting.meetingDate,
      status: meeting.status,
    },
    students: members.map((m) => ({
      ...m,
      status: statusById.get(m.id) ?? "",
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const meetingId = typeof body.meetingId === "string" ? body.meetingId : "";
  const records: { studentId: string; status: string }[] = Array.isArray(body.records)
    ? body.records
    : [];

  if (!meetingId || records.length === 0) {
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }

  const statusSet = new Set(["H", "I", "S", "A", "T"]);
  for (const r of records) {
    if (!r.studentId || !statusSet.has(r.status)) {
      return NextResponse.json({ error: "Data status tidak valid." }, { status: 400 });
    }
  }

  const meeting = await resolveMeeting(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
  }

  if (session.role === "PJ_GURU") {
    const allowed = await checkPJOwnership(
      session.role,
      session.sub,
      meeting.extracurricularId,
      async (userId, ekId) => {
        const rows = await db
          .select({ id: extracurricularStaff.id })
          .from(extracurricularStaff)
          .where(
            and(
              eq(extracurricularStaff.userId, userId),
              eq(extracurricularStaff.extracurricularId, ekId)
            )
          )
          .limit(1);
        return rows.length > 0;
      }
    );
    if (!allowed) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  // Ensure all student records belong to the meeting's extracurricular (ownership)
  const studentIds = records.map((r) => r.studentId);
  const targeted = await db
    .select({ studentId: memberships.studentId })
    .from(memberships)
    .where(
      and(
        eq(memberships.extracurricularId, meeting.extracurricularId),
        inArray(memberships.studentId, studentIds)
      )
    );
  const allowedStudentIds = new Set(targeted.map((t) => t.studentId));
  for (const r of records) {
    if (!allowedStudentIds.has(r.studentId)) {
      return NextResponse.json({ error: "Siswa bukan anggota ekskul ini." }, { status: 403 });
    }
  }

  // Transaction: replace attendance for this meeting
  await db.transaction(async (tx) => {
    await tx
      .delete(attendance)
      .where(eq(attendance.meetingId, meeting.id));

    if (records.length > 0) {
      await tx.insert(attendance).values(
        records.map((r) => ({
          id: randomUUID(),
          meetingId: meeting.id,
          studentId: r.studentId,
          status: r.status as "H" | "I" | "S" | "A" | "T",
          recordedBy: session.sub,
        }))
      );
    }

    // Mark meeting as finished
    await tx
      .update(meetings)
      .set({ status: "SELESAI" })
      .where(eq(meetings.id, meeting.id));
  });

  return NextResponse.json({ ok: true });
}
