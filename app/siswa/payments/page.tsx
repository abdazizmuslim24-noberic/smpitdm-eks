import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, extracurriculars, memberships } from "@/db/schema";
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
import { Paperclip, CreditCard, Download } from "lucide-react";

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

  const myEkskuls = await db
    .select({
      id: extracurriculars.id,
      name: extracurriculars.name,
      code: extracurriculars.code,
      bankName: extracurriculars.bankName,
      bankAccountNumber: extracurriculars.bankAccountNumber,
      bankAccountHolder: extracurriculars.bankAccountHolder,
      qrCodeUrl: extracurriculars.qrCodeUrl,
    })
    .from(memberships)
    .innerJoin(
      extracurriculars,
      eq(memberships.extracurricularId, extracurriculars.id)
    )
    .where(
      and(
        eq(memberships.studentId, student.id),
        eq(memberships.status, "AKTIF")
      )
    )
    .orderBy(sql`${extracurriculars.code} asc`);

  const ekskulsWithPaymentInfo = myEkskuls.filter(
    (e) =>
      e.bankName ||
      e.bankAccountNumber ||
      e.bankAccountHolder ||
      e.qrCodeUrl
  );

  return (
    <div>
      <PageHeader
        title="Pembayaran Saya"
        description={pendingCount > 0 ? `${pendingCount} pembayaran menunggu verifikasi.` : "Riwayat pembayaran iuran Anda."}
        actions={<SiswaPaymentDialog />}
      />

      {ekskulsWithPaymentInfo.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 shrink-0 text-primary" />
              <div className="font-semibold">Petunjuk Pembayaran per Ekstrakurikuler</div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfer / scan QR sesuai ekstrakurikuler yang Anda ikuti. Simpan bukti transfer lalu upload di &quot;Bukti Pembayaran&quot;.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {ekskulsWithPaymentInfo.map((e) => (
              <div key={e.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.code}</div>
                  </div>
                  {e.qrCodeUrl && (
                    <img
                      src={e.qrCodeUrl}
                      alt={`QR ${e.name}`}
                      className="h-14 w-14 rounded-md border border-border object-contain bg-white"
                    />
                  )}
                </div>
                <div className="mt-3 text-sm">
                  {e.bankName || e.bankAccountNumber ? (
                    <div className="space-y-0.5">
                      <div>
                        Transfer ke{" "}
                        <span className="font-semibold text-foreground">
                          {e.bankName ?? "Rekening"}
                        </span>{" "}
                        <span className="font-semibold text-foreground">
                          {e.bankAccountNumber ?? "—"}
                        </span>
                      </div>
                      {e.bankAccountHolder && (
                        <div className="text-muted-foreground">
                          a.n. {e.bankAccountHolder}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Pembayaran via rekening / scan QR.</p>
                  )}
                </div>
                {e.qrCodeUrl && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={e.qrCodeUrl}
                      alt={`QR ${e.name}`}
                      className="h-40 w-40 rounded-md border border-border object-contain bg-white"
                    />
                  </div>
                )}
                {e.qrCodeUrl && (
                  <div className="mt-3 flex justify-center">
                    <a
                      href={e.qrCodeUrl}
                      download={`QR-${e.code}.jpeg`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4" /> Download QR
                    </a>
                  </div>
                )}
                {!e.qrCodeUrl && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Transfer ke rekening di atas, lalu upload bukti pembayaran.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
