import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, students, extracurriculars } from "@/db/schema";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentVerifyDialog } from "@/components/features/payment/payment-verify-dialog";
import { PaymentMethodBadge, PaymentStatusBadge } from "@/components/features/payment/payment-badges";
import { Button } from "@/components/ui/button";
import { Receipt, Paperclip } from "lucide-react";

export const metadata = { title: "Pembayaran" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

async function loadPaymentsForStatus(status: "MENUNGGU_VERIFIKASI" | "LUNAS" | "DITOLAK") {
  return db
    .select({
      id: payments.id,
      student: students.name,
      ekName: extracurriculars.name,
      period: payments.period,
      amount: payments.amount,
      method: payments.paymentMethod,
      status: payments.status,
      proofFile: payments.proofFile,
      createdBy: payments.createdBy,
    })
    .from(payments)
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .where(eq(payments.status, status))
    .orderBy(sql`${payments.createdAt} desc`);
}

export default async function AdminPaymentsPage() {
  const pending = await loadPaymentsForStatus("MENUNGGU_VERIFIKASI");
  const paid = await loadPaymentsForStatus("LUNAS");
  const rejected = await loadPaymentsForStatus("DITOLAK");

  return (
    <div>
      <PageHeader
        title="Pembayaran"
        description="Kelola dan verifikasi pembayaran iuran ekstrakurikuler."
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Menunggu ({pending.length})</TabsTrigger>
          <TabsTrigger value="paid">Lunas ({paid.length})</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PaymentTable rows={pending} canVerify />
        </TabsContent>
        <TabsContent value="paid">
          <PaymentTable rows={paid} />
        </TabsContent>
        <TabsContent value="rejected">
          <PaymentTable rows={rejected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentTable({
  rows,
  canVerify = false,
}: {
  rows: Awaited<ReturnType<typeof loadPaymentsForStatus>>;
  canVerify?: boolean;
}) {
  return (
    <div className="mt-4 rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Ekstrakurikuler</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.student}</TableCell>
                <TableCell>{p.ekName}</TableCell>
                <TableCell>{p.period}</TableCell>
                <TableCell><PaymentMethodBadge method={p.method} /></TableCell>
                <TableCell>{formatRupiah(p.amount)}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canVerify ? (
                      <PaymentVerifyDialog paymentId={p.id} student={p.student} amount={p.amount} />
                    ) : p.status === "LUNAS" ? (
                      <Button asChild size="sm" variant="outline" className="gap-1">
                        <a href={`/admin/receipts/${p.id}`}>
                          <Receipt className="h-4 w-4" /> Kuitansi
                        </a>
                      </Button>
                    ) : null}
                    {p.proofFile ? (
                      <Button asChild size="sm" variant="ghost" className="gap-1 text-primary">
                        <a href={p.proofFile} target="_blank" rel="noreferrer">
                          <Paperclip className="h-4 w-4" /> Bukti
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
