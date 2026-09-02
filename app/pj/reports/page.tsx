import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  attendance,
  meetings,
  extracurriculars,
  payments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";
import { getAttendanceByStudent } from "@/lib/reports/attendance-by-student";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

export const metadata = { title: "Rekap & Laporan" };

const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default async function PjReportsPage() {
  const user = await getCurrentUser();
  const ekskulIds = await getPjEkskulIds(user.id);

  let attendanceRows: { ekskul: string; status: string }[] = [];
  let paymentRows: { ekskul: string; status: string; amount: number | null }[] = [];

  if (ekskulIds.length > 0) {
    attendanceRows = await db
      .select({
        ekskul: extracurriculars.name,
        status: attendance.status,
      })
      .from(attendance)
      .innerJoin(meetings, eq(attendance.meetingId, meetings.id))
      .innerJoin(extracurriculars, eq(meetings.extracurricularId, extracurriculars.id))
      .where(inArray(meetings.extracurricularId, ekskulIds));

    paymentRows = await db
      .select({
        ekskul: extracurriculars.name,
        status: payments.status,
        amount: payments.amount,
      })
      .from(payments)
      .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
      .where(inArray(payments.extracurricularId, ekskulIds));
  }

  const recap = new Map<string, { H: number; I: number; S: number; A: number; T: number }>();
  for (const r of attendanceRows) {
    const entry = recap.get(r.ekskul) ?? { H: 0, I: 0, S: 0, A: 0, T: 0 };
    const key = r.status as "H" | "I" | "S" | "A" | "T";
    if (key in entry) entry[key] += 1;
    recap.set(r.ekskul, entry);
  }

  const paySummary = new Map<string, { collected: number; pending: number; count: number }>();
  for (const p of paymentRows) {
    const entry = paySummary.get(p.ekskul) ?? { collected: 0, pending: 0, count: 0 };
    entry.count += 1;
    if (p.status === "LUNAS") entry.collected += p.amount ?? 0;
    if (p.status === "MENUNGGU_VERIFIKASI") entry.pending += p.amount ?? 0;
    paySummary.set(p.ekskul, entry);
  }

  const ekskuls = [...recap.keys()].sort();

  const studentAttendance = await getAttendanceByStudent(ekskulIds);

  return (
    <div>
      <PageHeader
        title="Rekap & Laporan"
        description="Ringkasan kehadiran dan pembayaran untuk ekskul Anda."
        actions={
          ekskulIds.length > 0 ? (
            <a href="/api/reports/attendance-export">
              <Button variant="outline">
                <Download /> Export XLSX
              </Button>
            </a>
          ) : (
            <Button variant="outline" disabled title="Tidak ada ekskul yang ditugaskan">
              <Download /> Export XLSX
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rekap Kehadiran per Ekskul</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ekskul</TableHead>
                    <TableHead>H</TableHead>
                    <TableHead>I</TableHead>
                    <TableHead>S</TableHead>
                    <TableHead>A</TableHead>
                    <TableHead>T</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ekskuls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Belum ada data absensi.
                      </TableCell>
                    </TableRow>
                  )}
                  {ekskuls.map((e) => {
                    const r = recap.get(e)!;
                    return (
                      <TableRow key={e}>
                        <TableCell className="font-medium">{e}</TableCell>
                        <TableCell>{r.H}</TableCell>
                        <TableCell>{r.I}</TableCell>
                        <TableCell>{r.S}</TableCell>
                        <TableCell>{r.A}</TableCell>
                        <TableCell>{r.T}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekap Pembayaran per Ekskul</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ekskul</TableHead>
                    <TableHead>Transaksi</TableHead>
                    <TableHead>Terlunasi</TableHead>
                    <TableHead>Menunggu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paySummary.size === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada data pembayaran.
                      </TableCell>
                    </TableRow>
                  )}
                  {[...paySummary.entries()].map(([e, p]) => (
                    <TableRow key={e}>
                      <TableCell className="font-medium">{e}</TableCell>
                      <TableCell>{p.count}</TableCell>
                      <TableCell>{formatRupiah(p.collected)}</TableCell>
                      <TableCell>{formatRupiah(p.pending)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rekap Kehadiran per Siswa</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ekskul</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>H</TableHead>
                  <TableHead>I</TableHead>
                  <TableHead>S</TableHead>
                  <TableHead>A</TableHead>
                  <TableHead>T</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentAttendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Belum ada data absensi siswa.
                    </TableCell>
                  </TableRow>
                )}
                {studentAttendance.map((s) => (
                  <TableRow key={`${s.ekskulId}-${s.nis}`}>
                    <TableCell className="font-medium">{s.ekskul}</TableCell>
                    <TableCell>{s.nis}</TableCell>
                    <TableCell>{s.studentName}</TableCell>
                    <TableCell>{s.H}</TableCell>
                    <TableCell>{s.I}</TableCell>
                    <TableCell>{s.S}</TableCell>
                    <TableCell>{s.A}</TableCell>
                    <TableCell>{s.T}</TableCell>
                    <TableCell className="font-semibold">{s.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
