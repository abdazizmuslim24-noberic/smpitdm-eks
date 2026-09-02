import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  extracurriculars,
  memberships,
  meetings,
  payments,
  attendance,
  users,
  extracurricularStaff,
} from "@/db/schema";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
} from "lucide-react";

export const metadata = { title: "Dashboard Admin" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function AdminDashboardPage() {
  const [studentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(students);
  const [ekskulCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(extracurriculars);
  const [memberCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(memberships);
  const [meetingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(meetings);

  const [pendingPaymentAgg] = await db
    .select({ sum: sql<number | null>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.status, "MENUNGGU_VERIFIKASI"));

  const recentMeetings = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      date: meetings.meetingDate,
      status: meetings.status,
      ekskul: extracurriculars.name,
    })
    .from(meetings)
    .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
    .orderBy(sql`${meetings.meetingDate} desc`)
    .limit(5);

  const pendingPayments = await db
    .select({
      id: payments.id,
      student: students.name,
      ekskul: extracurriculars.name,
      period: payments.period,
      amount: payments.amount,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .where(eq(payments.status, "MENUNGGU_VERIFIKASI"))
    .orderBy(sql`${payments.createdAt} desc`)
    .limit(5);

  const [staffCount] = await db.select({ count: sql<number>`count(*)` }).from(extracurricularStaff);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [attendanceCount] = await db.select({ count: sql<number>`count(*)` }).from(attendance);

  return (
    <div>
      <PageHeader
        title="Dashboard Admin"
        description="Ringkasan data ekstrakurikuler sekolah."
        actions={
          <>
            <Button asChild>
              <a href="/admin/extracurriculars">
                <Plus /> Kelola Ekskul
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/attendance">Input Absensi</a>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Siswa" value={String(studentCount.count)} icon="GraduationCap" className="border-primary" />
        <StatCard label="Ekstrakurikuler" value={String(ekskulCount.count)} icon="Trophy" className="border-primary" />
        <StatCard label="Anggota Aktif" value={String(memberCount.count)} icon="UserPlus" className="border-primary" />
        <StatCard label="Pertemuan" value={String(meetingCount.count)} icon="CalendarDays" className="border-primary" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Pengguna"
          value={String(userCount.count)}
          icon="Users"
          className="border-primary"
        />
        <StatCard
          label="Staf PJ"
          value={String(staffCount.count)}
          icon="ShieldCheck"
          className="border-primary"
        />
        <StatCard
          label="Catatan Absensi"
          value={String(attendanceCount.count)}
          icon="ClipboardCheck"
          className="border-primary"
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={formatRupiah(pendingPaymentAgg?.sum ?? 0)}
          icon="Wallet"
          className="border-warning"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CardBlock
          title="Pertemuan Terbaru"
          action={<a href="/admin/meetings" className="text-sm text-primary">Lihat semua</a>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik</TableHead>
                <TableHead>Ekskul</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMeetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Belum ada pertemuan.
                  </TableCell>
                </TableRow>
              )}
              {recentMeetings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.topic}</TableCell>
                  <TableCell>{m.ekskul}</TableCell>
                  <TableCell>
                    <MeetingBadge status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBlock>

        <CardBlock
          title="Pembayaran Menunggu Verifikasi"
          action={<a href="/admin/payments" className="text-sm text-primary">Kelola</a>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Ekskul</TableHead>
                <TableHead>Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Tidak ada pembayaran yang menunggu.
                  </TableCell>
                </TableRow>
              )}
              {pendingPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.student}</TableCell>
                  <TableCell>{p.ekskul}</TableCell>
                  <TableCell>{formatRupiah(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBlock>
      </div>

      <div className="mt-6">
        <span className="text-xs text-muted-foreground">
          Total penerimaan yang belum diverifikasi:{" "}
          <strong>{formatRupiah(pendingPaymentAgg?.sum ?? 0)}</strong>
          {" · "}SMPITDM EKSKUL
        </span>
      </div>
    </div>
  );
}

function CardBlock({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-heading font-semibold">{title}</h2>
        {action}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function MeetingBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "default" | "muted" }> = {
    DIJADWALKAN: { label: "Dijadwalkan", variant: "default" },
    BERLANGSUNG: { label: "Berlangsung", variant: "warning" },
    SELESAI: { label: "Selesai", variant: "success" },
    DIBATALKAN: { label: "Dibatalkan", variant: "muted" },
  };
  const m = map[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
