import { NextResponse } from "next/server";
import { inArray, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "@/db";
import { attendance, meetings, extracurriculars, students } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { getPjEkskulIds } from "@/lib/pj-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATT_HEADERS = ["No", "NIS", "Nama Siswa", "Ekskul", "Status", "Keterangan"];

export async function GET() {
  const session = await requireSession();
  let ekskulIds: string[] | null = null; // null => all (admin)

  if (session.role === "ADMIN") {
    if (!hasPermission(session.role, "reports.view")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  } else if (session.role === "PJ_GURU") {
    if (!hasPermission(session.role, "reports.view")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    ekskulIds = await getPjEkskulIds(session.sub);
  } else {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const base = db
    .select({
      nis: students.nis,
      studentName: students.name,
      ekskul: extracurriculars.name,
      status: attendance.status,
      notes: attendance.notes,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .innerJoin(meetings, eq(attendance.meetingId, meetings.id))
    .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id));

  const attendanceRows = ekskulIds
    ? await base.where(inArray(meetings.extracurricularId, ekskulIds))
    : await base;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Absensi");

  ws.columns = ATT_HEADERS.map((h, i) => ({
    header: h,
    key: `c${i}`,
    width: i === 2 ? 32 : i === 3 ? 24 : 14,
  }));

  attendanceRows.forEach((r, idx) => {
    ws.addRow({
      c0: idx + 1,
      c1: r.nis,
      c2: r.studentName,
      c3: r.ekskul,
      c4: r.status,
      c5: r.notes ?? "",
    });
  });

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="rekap_absensi.xlsx"',
    },
  });
}