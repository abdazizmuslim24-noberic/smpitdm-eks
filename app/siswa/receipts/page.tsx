import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, paymentReceipts, extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, Eye } from "lucide-react";

export const metadata = { title: "Kuitansi" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function SiswaReceiptsPage() {
  const user = await getCurrentUser();
  const student = await getStudentForUser(user.id);

  const rows = await db
    .select({
      receiptId: paymentReceipts.id,
      receiptNumber: paymentReceipts.receiptNumber,
      generatedAt: paymentReceipts.generatedAt,
      ekName: extracurriculars.name,
      period: payments.period,
      amount: payments.amount,
      paymentId: payments.id,
    })
    .from(paymentReceipts)
    .innerJoin(payments, eq(paymentReceipts.paymentId, payments.id))
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .where(eq(payments.studentId, student.id))
    .orderBy(sql`${paymentReceipts.generatedAt} desc`);

  return (
    <div>
      <PageHeader
        title="Kuitansi"
        description="Kuitansi pembayaran yang telah lunas. Kuitansi hanya tersedia untuk pembayaran berstatus Lunas."
      />

      {rows.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          Belum ada kuitansi. Kuitansi dibuat otomatis setelah pembayaran diverifikasi Lunas.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Kuitansi</TableHead>
                  <TableHead>Ekstrakurikuler</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.receiptId}>
                    <TableCell className="font-mono text-xs">{r.receiptNumber}</TableCell>
                    <TableCell className="font-medium">{r.ekName}</TableCell>
                    <TableCell>{r.period}</TableCell>
                    <TableCell>{formatRupiah(r.amount)}</TableCell>
                    <TableCell><Badge variant="success">Lunas</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/siswa/receipts/${r.paymentId}`}>
                          <Eye /> Lihat / Cetak
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
