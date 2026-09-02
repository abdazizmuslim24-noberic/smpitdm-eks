import { sql, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { meetings, extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";
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

export default async function PjMeetingsPage() {
  const user = await getCurrentUser();
  const ekskulIds = await getPjEkskulIds(user.id);

  const rows =
    ekskulIds.length > 0
      ? await db
          .select({
            id: meetings.id,
            topic: meetings.topic,
            date: meetings.meetingDate,
            location: meetings.location,
            status: meetings.status,
            ekName: extracurriculars.name,
          })
          .from(meetings)
          .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
          .where(inArray(meetings.extracurricularId, ekskulIds))
          .orderBy(sql`${meetings.meetingDate} desc`)
      : [];

  return (
    <div>
      <PageHeader
        title="Pertemuan"
        description="Jadwalkan dan kelola pertemuan ekstrakurikuler Anda."
        actions={<MeetingFormDialog ekskulEndpoint="/api/pj/ekskuls" />}
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
                  <TableCell>{m.date.toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{m.location ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[m.status] ?? "muted"}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/pj/attendance?meeting=${m.id}`}>
                          <ClipboardCheck /> Absensi
                        </a>
                      </Button>
                      <MeetingDeleteButton id={m.id} topic={m.topic} status={m.status} />
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
