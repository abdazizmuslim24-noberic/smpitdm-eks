import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, students, extracurriculars } from "@/db/schema";
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
import { MembershipFormDialog } from "@/components/features/admin/membership-form-dialog";
import { MembershipRowActions } from "@/components/features/admin/membership-row-actions";

export const metadata = { title: "Keanggotaan" };

export default async function AdminMembershipsPage() {
  const rows = await db
    .select({
      id: memberships.id,
      studentId: memberships.studentId,
      extracurricularId: memberships.extracurricularId,
      studentName: students.name,
      nis: students.nis,
      ekName: extracurriculars.name,
      status: memberships.status,
      joinedAt: memberships.joinedAt,
    })
    .from(memberships)
    .innerJoin(students, eq(memberships.studentId, students.id))
    .innerJoin(extracurriculars, eq(memberships.extracurricularId, extracurriculars.id))
    .orderBy(sql`${students.name} asc`);

  return (
    <div>
      <PageHeader
        title="Keanggotaan"
        description="Kelola pendaftaran siswa ke ekstrakurikuler."
        actions={<MembershipFormDialog />}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Ekstrakurikuler</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada keanggotaan.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.studentName}</TableCell>
                  <TableCell>{m.nis}</TableCell>
                  <TableCell>{m.ekName}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "AKTIF" ? "success" : m.status === "KELUAR" ? "destructive" : "muted"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.joinedAt.toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    <MembershipRowActions
                      membership={{
                        id: m.id,
                        studentId: m.studentId,
                        extracurricularId: m.extracurricularId,
                        status: m.status,
                      }}
                    />
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
