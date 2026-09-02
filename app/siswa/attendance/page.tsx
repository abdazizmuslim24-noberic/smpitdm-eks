import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, meetings, extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Absensi Saya" };

const attMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
  H: { label: "Hadir", variant: "success" },
  S: { label: "Sakit", variant: "warning" },
  I: { label: "Izin", variant: "default" },
  A: { label: "Alpa", variant: "destructive" },
  T: { label: "Terlambat", variant: "warning" },
};

export default async function SiswaAttendancePage() {
  const user = await getCurrentUser();
  const student = await getStudentForUser(user.id);

  const rows = await db
    .select({
      status: attendance.status,
      topic: meetings.topic,
      date: meetings.meetingDate,
      ekskul: extracurriculars.name,
    })
    .from(attendance)
    .innerJoin(meetings, eq(attendance.meetingId, meetings.id))
    .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
    .where(eq(attendance.studentId, student.id))
    .orderBy(sql`${meetings.meetingDate} desc`);

  return (
    <div>
      <PageHeader
        title="Absensi Saya"
        description="Riwayat kehadiran Anda pada kegiatan ekstrakurikuler."
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pertemuan</TableHead>
                <TableHead>Ekstrakurikuler</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada catatan absensi.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r, i) => {
                const m = attMap[r.status] ?? { label: r.status, variant: "default" as const };
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.topic}</TableCell>
                    <TableCell>{r.ekskul}</TableCell>
                    <TableCell>{r.date.toLocaleDateString("id-ID")}</TableCell>
                    <TableCell><Badge variant={m.variant}>{m.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
