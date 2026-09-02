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
import { MeetingFormDialog } from "@/components/features/admin/meeting-form-dialog";
import { MeetingDeleteButton } from "@/components/features/admin/meeting-delete-button";
import { ClipboardCheck } from "lucide-react";

export const metadata = { title: "Pertemuan" };

const statusVariant: Record<string, "success" | "warning" | "default" | "muted"> = {
  DIJADWALKAN: "default",
  BERLANGSUNG: "warning",
  SELESAI: "success",
  DIBATALKAN: "muted",
};

export default async function AdminMeetingsPage() {
  const rows = await db
    .select({
      id: meetings.id,
      topic: meetings.topic,
      date: meetings.meetingDate,
      location: meetings.location,
      status: meetings.status,
      startTime: meetings.startTime,
      endTime: meetings.endTime,
      extracurricularId: meetings.extracurricularId,
      ekName: extracurriculars.name,
    })
    .from(meetings)
    .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
    .orderBy(sql`${meetings.meetingDate} desc`);

  return (
    <div>
      <PageHeader
        title="Pertemuan"
        description="Jadwalkan dan kelola pertemuan ekstrakurikuler."
        actions={<MeetingFormDialog />}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik</TableHead>
                <TableHead>Ekstrakurikuler</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada pertemuan.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.topic}</TableCell>
                  <TableCell>{m.ekName}</TableCell>
                  <TableCell>{m.date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</TableCell>
                  <TableCell>{m.location ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[m.status] ?? "muted"}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/attendance?meeting=${m.id}`}>
                          <ClipboardCheck /> Absensi
                        </a>
                      </Button>
                      <MeetingFormDialog
                        meeting={{
                          id: m.id,
                          topic: m.topic,
                          meetingDate: m.date.toISOString(),
                          startTime: m.startTime,
                          endTime: m.endTime,
                          location: m.location,
                          status: m.status,
                          extracurricularId: m.extracurricularId,
                        }}
                      />
                      <MeetingDeleteButton id={m.id} topic={m.topic} />
                    </div>
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
