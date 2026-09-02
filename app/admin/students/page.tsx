import { sql } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
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
import { StudentFormDialog } from "@/components/features/admin/student-form-dialog";
import { StudentImportDialog } from "@/components/features/admin/student-import-dialog";
import { StudentRowActions } from "@/components/features/admin/student-row-actions";

export const metadata = { title: "Siswa" };

export default async function AdminStudentsPage() {
  const allStudents = await db
    .select()
    .from(students)
    .orderBy(sql`${students.name} asc`);

  return (
    <div>
      <PageHeader
        title="Siswa"
        description="Kelola data siswa."
        actions={
          <>
            <StudentImportDialog />
            <StudentFormDialog />
          </>
        }
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIS</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada siswa.
                  </TableCell>
                </TableRow>
              )}
              {allStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nis}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.className ?? "—"}</TableCell>
                  <TableCell>
                    {s.gender === "L" ? "Laki-laki" : s.gender === "P" ? "Perempuan" : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "AKTIF" ? "success" : s.status === "LULUS" ? "default" : "muted"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <StudentRowActions
                      student={{
                        id: s.id,
                        nis: s.nis,
                        name: s.name,
                        gender: s.gender,
                        className: s.className,
                        status: s.status,
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
