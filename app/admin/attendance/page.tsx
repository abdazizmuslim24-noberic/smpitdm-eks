import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { meetings, extracurriculars } from "@/db/schema";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceManager } from "@/components/features/attendance/attendance-manager";
import { ClipboardCheck } from "lucide-react";

export const metadata = { title: "Absensi" };

const statusVariant: Record<string, "success" | "warning" | "default" | "muted"> = {
  DIJADWALKAN: "default",
  BERLANGSUNG: "warning",
  SELESAI: "success",
  DIBATALKAN: "muted",
};

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>;
}) {
  const { meeting: meetingId } = await searchParams;

  if (meetingId) {
    return <AttendanceManager meetingId={meetingId} />;
  }

  const rows = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      date: meetings.meetingDate,
      status: meetings.status,
      ekName: extracurriculars.name,
    })
    .from(meetings)
    .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
    .orderBy(sql`${meetings.meetingDate} desc`);

  return (
    <div>
      <PageHeader
        title="Absensi"
        description="Pilih pertemuan untuk mengisi absensi siswa."
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik</TableHead>
                <TableHead>Ekstrakurikuler</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada pertemuan.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.topic}</TableCell>
                  <TableCell>{m.ekName}</TableCell>
                  <TableCell>{m.date.toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[m.status] ?? "muted"}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/admin/attendance?meeting=${m.id}`}>
                        <ClipboardCheck /> Kelola
                      </a>
                    </Button>
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
