import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiswaPaymentDialog } from "@/components/features/payment/siswa-payment-dialog";
import { PaymentStatusBadge } from "@/components/features/payment/payment-badges";
import { Paperclip } from "lucide-react";

export const metadata = { title: "Pembayaran Saya" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function SiswaPaymentsPage() {
  const user = await getCurrentUser();
  const student = await getStudentForUser(user.id);

  const rows = await db
    .select({
      id: payments.id,
      ekName: extracurriculars.name,
      period: payments.period,
      amount: payments.amount,
      method: payments.paymentMethod,
      status: payments.status,
      proofFile: payments.proofFile,
      verifiedAt: payments.verifiedAt,
      verificationNote: payments.verificationNote,
    })
    .from(payments)
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .where(eq(payments.studentId, student.id))
    .orderBy(sql`${payments.createdAt} desc`);

  const pendingCount = rows.filter((r) => r.status === "MENUNGGU_VERIFIKASI").length;

  return (
    <div>
      <PageHeader
        title="Pembayaran Saya"
        description={pendingCount > 0 ? `${pendingCount} pembayaran menunggu verifikasi.` : "Riwayat pembayaran iuran Anda."}
        actions={<SiswaPaymentDialog />}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ekstrakurikuler</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bukti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada pembayaran.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.ekName}</TableCell>
                  <TableCell>{p.period}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>{formatRupiah(p.amount)}</TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={p.status} />
                    {p.status === "DITOLAK" && p.verificationNote && (
                      <div className="mt-1 text-xs text-destructive">Catatan: {p.verificationNote}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.proofFile ? (
                      <a
                        href={p.proofFile}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Paperclip className="h-4 w-4" /> Lihat
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
