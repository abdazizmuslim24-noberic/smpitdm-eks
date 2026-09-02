import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, extracurricularStaff, extracurriculars } from "@/db/schema";
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
import { UserFormDialog } from "@/components/features/admin/user-form-dialog";
import { UserRowActions } from "@/components/features/admin/user-row-actions";

export const metadata = { title: "Pengguna" };

const roleBadge: Record<string, { label: string; variant: "default" | "secondary" | "warning" }> = {
  ADMIN: { label: "Admin", variant: "default" },
  PJ_GURU: { label: "PJ / Guru", variant: "warning" },
  SISWA: { label: "Siswa", variant: "secondary" },
};

export default async function AdminUsersPage() {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} asc`);

  const assignments = await db
    .select({
      userId: extracurricularStaff.userId,
      ekskul: extracurriculars.name,
    })
    .from(extracurricularStaff)
    .innerJoin(extracurriculars, eq(extracurricularStaff.extracurricularId, extracurriculars.id));

  const assignmentsByUser = new Map<string, string[]>();
  for (const a of assignments) {
    const list = assignmentsByUser.get(a.userId) ?? [];
    list.push(a.ekskul);
    assignmentsByUser.set(a.userId, list);
  }

  return (
    <div>
      <PageHeader
        title="Pengguna"
        description="Kelola akun pengguna sistem."
        actions={<UserFormDialog />}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Penugasan Ekskul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada pengguna.
                  </TableCell>
                </TableRow>
              )}
              {allUsers.map((u) => {
                const rb = roleBadge[u.role] ?? { label: u.role, variant: "secondary" as const };
                const assigned = assignmentsByUser.get(u.id) ?? [];
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={rb.variant}>{rb.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {assigned.length > 0 ? assigned.join(", ") : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive === 1 ? "success" : "destructive"}>
                        {u.isActive === 1 ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions
                        user={{
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          role: u.role,
                          isActive: u.isActive,
                        }}
                      />
                    </TableCell>
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
