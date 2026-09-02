import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  attendance,
  meetings,
  extracurriculars,
  students,
} from "@/db/schema";

export interface EkskulStudentRow {
  ekskulId: string;
  ekskul: string;
  nis: string;
  studentName: string;
  H: number;
  I: number;
  S: number;
  A: number;
  T: number;
  total: number;
}

type AttStatus = "H" | "I" | "S" | "A" | "T";

/**
 * Aggregate attendance per student per ekskul.
 * Pass an optional list of ekskul ids to scope (e.g. for PJ).
 */
export async function getAttendanceByStudent(
  ekskulIds?: string[]
): Promise<EkskulStudentRow[]> {
  const base = db
    .select({
      ekskulId: extracurriculars.id,
      ekskul: extracurriculars.name,
      nis: students.nis,
      studentName: students.name,
      status: attendance.status,
    })
    .from(attendance)
    .innerJoin(meetings, eq(attendance.meetingId, meetings.id))
    .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
    .innerJoin(students, eq(attendance.studentId, students.id));

  const rows =
    ekskulIds && ekskulIds.length > 0
      ? await base.where(inArray(meetings.extracurricularId, ekskulIds))
      : await base;

  const map = new Map<string, EkskulStudentRow>();
  for (const r of rows) {
    const key = `${r.ekskulId}|${r.nis}`;
    const entry = map.get(key) ?? {
      ekskulId: r.ekskulId,
      ekskul: r.ekskul,
      nis: r.nis,
      studentName: r.studentName,
      H: 0,
      I: 0,
      S: 0,
      A: 0,
      T: 0,
      total: 0,
    };
    const status = r.status as AttStatus;
    if (status in entry) entry[status] += 1;
    entry.total += 1;
    map.set(key, entry);
  }

  return [...map.values()].sort((a, b) =>
    a.ekskul === b.ekskul
      ? a.studentName.localeCompare(b.studentName)
      : a.ekskul.localeCompare(b.ekskul)
  );
}