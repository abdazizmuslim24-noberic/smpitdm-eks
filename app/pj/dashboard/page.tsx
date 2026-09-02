import { eq, inArray, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  extracurriculars,
  meetings,
  attendance,
  memberships,
  payments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";
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
import { Trophy } from "lucide-react";

export const metadata = { title: "Dashboard PJ" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function PjDashboardPage() {
  const user = await getCurrentUser();
  const ekskulIds = await getPjEkskulIds(user.id);

  if (ekskulIds.length === 0) {
    return (
      <div>
        <PageHeader
          title="Dashboard PJ"
          description="Anda belum ditugaskan ke ekstrakurikuler mana pun."
        />
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Hubungi Admin untuk mendapatkan penugasan sebagai PJ/Guru ekstrakurikuler.
        </div>
      </div>
    );
  }

  const [ekskulCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(extracurriculars)
    .where(inArray(extracurriculars.id, ekskulIds));

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(memberships)
    .where(
      and(
        inArray(memberships.extracurricularId, ekskulIds),
        eq(memberships.status, "AKTIF")
      )
    );

  const [meetingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(meetings)
    .where(inArray(meetings.extracurricularId, ekskulIds));

  const [attendanceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .innerJoin(meetings, eq(attendance.meetingId, meetings.id))
    .where(inArray(meetings.extracurricularId, ekskulIds));

  const [pendingAgg] = await db
    .select({ sum: sql<number | null>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(
        inArray(payments.extracurricularId, ekskulIds),
        eq(payments.status, "MENUNGGU_VERIFIKASI")
      )
    );

  const ekskuls = await db
    .select()
    .from(extracurriculars)
    .where(inArray(extracurriculars.id, ekskulIds));

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
    .where(inArray(meetings.extracurricularId, ekskulIds))
    .orderBy(sql`${meetings.meetingDate} desc`)
    .limit(6);

  return (
    <div>
      <PageHeader
        title="Dashboard PJ"
        description={`Ringkasan ekstrakurikuler yang Anda kelola (${ekskulCount.count}).`}
        actions={
          <a href="/pj/attendance">
            <Badge className="cursor-pointer px-3 py-1.5">Input Absensi</Badge>
          </a>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {ekskuls.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm"
          >
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.code}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Ekstrakurikuler" value={String(ekskulCount.count)} icon="Trophy" className="border-primary" />
        <StatCard label="Anggota Aktif" value={String(memberCount.count)} icon="Users" className="border-primary" />
        <StatCard label="Pertemuan" value={String(meetingCount.count)} icon="CalendarDays" className="border-primary" />
        <StatCard label="Catatan Absensi" value={String(attendanceCount.count)} icon="ClipboardCheck" className="border-primary" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard
          label="Pembayaran Menunggu"
          value={formatRupiah(pendingAgg?.sum ?? 0)}
          icon="Wallet"
          className="border-warning"
        />
      </div>

      <div className="mt-6 rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-heading font-semibold">Pertemuan Terbaru</h2>
          <a href="/pj/meetings" className="text-sm text-primary">Lihat semua</a>
        </div>
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik</TableHead>
                <TableHead>Ekskul</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMeetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada pertemuan.
                  </TableCell>
                </TableRow>
              )}
              {recentMeetings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.topic}</TableCell>
                  <TableCell>{m.ekskul}</TableCell>
                  <TableCell>{new Date(m.date).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "SELESAI" ? "success" : m.status === "BERLANGSUNG" ? "warning" : "default"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
