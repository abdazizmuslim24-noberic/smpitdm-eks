import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { extracurriculars, extracurricularStaff, users } from "@/db/schema";
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
import { ExtracurricularFormDialog } from "@/components/features/admin/extracurricular-form-dialog";
import { ExtracurricularRowActions } from "@/components/features/admin/extracurricular-row-actions";
import { AssignStaffDialog } from "@/components/features/admin/assign-staff-dialog";

export const metadata = { title: "Ekstrakurikuler" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function AdminExtracurricularsPage() {
  const ekskuls = await db.select().from(extracurriculars).orderBy(sql`${extracurriculars.code} asc`);

  const staffRows = await db
    .select({
      ekId: extracurricularStaff.extracurricularId,
      name: users.name,
      email: users.email,
    })
    .from(extracurricularStaff)
    .innerJoin(users, eq(extracurricularStaff.userId, users.id));

  const staffByEk = new Map<string, { name: string; email: string }[]>();
  for (const s of staffRows) {
    const list = staffByEk.get(s.ekId) ?? [];
    list.push({ name: s.name, email: s.email });
    staffByEk.set(s.ekId, list);
  }

  return (
    <div>
      <PageHeader
        title="Ekstrakurikuler"
        description="Kelola data ekstrakurikuler dan penugasan PJ."
        actions={<ExtracurricularFormDialog />}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Iuran Bulanan</TableHead>
                <TableHead>PJ / Guru</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ekskuls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada ekstrakurikuler.
                  </TableCell>
                </TableRow>
              )}
              {ekskuls.map((e) => {
                const staff = staffByEk.get(e.id) ?? [];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.code}</TableCell>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>
                      {e.day ? `${e.day} ${e.startTime ?? ""}–${e.endTime ?? ""}` : "—"}
                    </TableCell>
                    <TableCell>{formatRupiah(e.monthlyFee)}</TableCell>
                    <TableCell>
                      {staff.length > 0
                        ? staff.map((s) => s.name).join(", ")
                        : (
                          <AssignStaffDialog
                            extracurricularId={e.id}
                            extracurricularName={e.name}
                          />
                        )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.status === "AKTIF" ? "success" : "muted"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ExtracurricularRowActions
                        extracurricular={{
                          id: e.id,
                          code: e.code,
                          name: e.name,
                          day: e.day,
                          startTime: e.startTime,
                          endTime: e.endTime,
                          location: e.location,
                          monthlyFee: e.monthlyFee,
                          bankName: e.bankName,
                          bankAccountNumber: e.bankAccountNumber,
                          bankAccountHolder: e.bankAccountHolder,
                          qrCodeUrl: e.qrCodeUrl,
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
