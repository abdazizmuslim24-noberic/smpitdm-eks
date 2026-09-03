import { sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EkskulPaymentDialog,
  type EkskulPaymentData,
} from "@/components/features/pj/ekskul-payment-dialog";

export const metadata = { title: "Pengaturan Ekskul" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function PjEkskulsPage() {
  const user = await getCurrentUser();
  const ekskulIds = await getPjEkskulIds(user.id);

  const ekskuls =
    ekskulIds.length > 0
      ? await db
          .select()
          .from(extracurriculars)
          .where(inArray(extracurriculars.id, ekskulIds))
          .orderBy(sql`${extracurriculars.code} asc`)
      : [];

  return (
    <div>
      <PageHeader
        title="Pengaturan Ekskul"
        description="Atur data pembayaran (rekening & QR) untuk ekskul yang Anda bina."
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Iuran Bulanan</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>QR</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ekskuls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Tidak ada ekstrakurikuler yang Anda bina.
                  </TableCell>
                </TableRow>
              )}
              {ekskuls.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.code}</TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>{formatRupiah(e.monthlyFee)}</TableCell>
                  <TableCell>
                    {e.bankName || e.bankAccountNumber ? (
                      <div className="text-sm">
                        <div className="font-medium">{e.bankName ?? "—"}</div>
                        <div className="text-muted-foreground">{e.bankAccountNumber ?? "—"}</div>
                        {e.bankAccountHolder && (
                          <div className="text-muted-foreground">a.n. {e.bankAccountHolder}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Belum diatur</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {e.qrCodeUrl ? (
                      <img
                        src={e.qrCodeUrl}
                        alt="QR"
                        className="h-12 w-12 rounded border border-border object-contain bg-white"
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <EkskulPaymentDialog ekskul={e as EkskulPaymentData} />
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
