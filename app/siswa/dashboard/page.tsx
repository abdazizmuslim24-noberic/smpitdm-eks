import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  extracurriculars,
  memberships,
  attendance,
  meetings,
  payments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Dashboard Siswa" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function SiswaDashboardPage() {
  const user = await getCurrentUser();
  const student = await getStudentForUser(user.id);

  const myMemberships = await db
    .select({
      id: memberships.id,
      status: memberships.status,
      names: sql<string>`string_agg(${extracurriculars.name}, ', ')`,
      joinedAt: memberships.joinedAt,
    })
    .from(memberships)
    .innerJoin(extracurriculars, eq(memberships.extracurricularId, extracurriculars.id))
    .where(eq(memberships.studentId, student.id))
    .groupBy(memberships.id);

  const activeMemberships = myMemberships.filter((m) => m.status === "AKTIF");

  const [attendanceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(eq(attendance.studentId, student.id));

  const [paidCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(and(eq(payments.studentId, student.id), eq(payments.status, "LUNAS")));

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(and(eq(payments.studentId, student.id), eq(payments.status, "MENUNGGU_VERIFIKASI")));

  const recentAttendance = await db
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
    .orderBy(sql`${meetings.meetingDate} desc`)
    .limit(6);

  const recentPayments = await db
    .select({
      id: payments.id,
      ekskul: extracurriculars.name,
      period: payments.period,
      amount: payments.amount,
      status: payments.status,
    })
    .from(payments)
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .where(eq(payments.studentId, student.id))
    .orderBy(sql`${payments.createdAt} desc`)
    .limit(6);

  return (
    <div>
      <PageHeader
        title={student.name}
        description={`NIS ${student.nis}${student.className ? " · Kelas " + student.className : ""}`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Ekskul Diikuti" value={String(activeMemberships.length)} icon="Trophy" className="border-primary" />
        <StatCard label="Kehadiran" value={String(attendanceCount.count)} icon="CalendarCheck" className="border-primary" />
        <StatCard label="Pembayaran Lunas" value={String(paidCount.count)} icon="CheckCircle2" className="border-success" />
        <StatCard label="Menunggu Verifikasi" value={String(pendingCount.count)} icon="Wallet" className="border-warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-heading font-semibold">Absensi Terbaru</h2>
          </div>
          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pertemuan</TableHead>
                  <TableHead>Ekskul</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada catatan absensi.
                    </TableCell>
                  </TableRow>
                )}
                {recentAttendance.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{a.topic}</TableCell>
                    <TableCell>{a.ekskul}</TableCell>
                    <TableCell><AttendanceBadge status={a.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-heading font-semibold">Pembayaran Terbaru</h2>
          </div>
          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ekskul</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada pembayaran.
                    </TableCell>
                  </TableRow>
                )}
                {recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.ekskul}</TableCell>
                    <TableCell>{p.period}</TableCell>
                    <TableCell>{formatRupiah(p.amount)}</TableCell>
                    <TableCell><PaymentBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
    H: { label: "Hadir", variant: "success" },
    S: { label: "Sakit", variant: "warning" },
    I: { label: "Izin", variant: "default" },
    A: { label: "Alpa", variant: "destructive" },
    T: { label: "Terlambat", variant: "warning" },
  };
  const m = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
    LUNAS: { label: "Lunas", variant: "success" },
    MENUNGGU_VERIFIKASI: { label: "Menunggu", variant: "warning" },
    DITOLAK: { label: "Ditolak", variant: "destructive" },
  };
  const m = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
