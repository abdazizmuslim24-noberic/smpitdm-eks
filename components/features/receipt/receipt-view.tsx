export interface ReceiptData {
  receiptNumber: string;
  generatedAt: Date;
  studentName: string;
  ekName: string;
  period: string;
  amount: number;
  paymentDate: Date;
  verifiedByName?: string | null;
  extracurricularId?: string;
  paymentAccount?: {
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;
  } | null;
}

export function ReceiptView({ data }: { data: ReceiptData }) {
  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm print:border-0 print:shadow-none">
      <div className="mb-6 flex items-start justify-between border-b pb-4">
        <div>
          <div className="font-heading text-lg font-bold">SMPITDM EKSKULKU</div>
          <div className="text-sm text-muted-foreground">
            Sistem Manajemen Ekstrakurikuler Sekolah
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Nomor Kuitansi</div>
          <div className="font-mono text-sm font-semibold">{data.receiptNumber}</div>
          <div className="text-xs text-muted-foreground">
            {data.generatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Row label="Diterima Dari" value={data.studentName} />
        <Row label="Ekstrakurikuler" value={data.ekName} />
        <Row label="Periode" value={data.period} />
        <Row label="Tanggal Pembayaran" value={data.paymentDate.toLocaleDateString("id-ID")} />
        {data.paymentAccount &&
          (data.paymentAccount.bankName ||
            data.paymentAccount.bankAccountNumber) && (
            <Row
              label="Dibayar Melalui"
              value={[
                data.paymentAccount.bankName,
                data.paymentAccount.bankAccountNumber,
                data.paymentAccount.bankAccountHolder
                  ? `a.n. ${data.paymentAccount.bankAccountHolder}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Total Pembayaran</span>
          <span className="font-heading text-2xl font-bold text-foreground">
            {formatRupiah(data.amount)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground capitalize">
          {numberToWords(data.amount)} rupiah
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="text-center">
          <div className="mb-2 text-xs text-muted-foreground">
            Dibayar & Diverifikasi
          </div>
          <div className="mx-auto h-px w-32 bg-foreground print:bg-black" />
          <div className="mt-1 text-sm">{data.verifiedByName ?? "Administrator"}</div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Kuitansi ini dihasilkan otomatis oleh SMPITDM EKSKULKU.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function numberToWords(n: number): string {
  const satuan = [
    "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
    "sepuluh", "sebelas",
  ];
  if (n < 12) return satuan[n] ?? "";
  if (n < 20) return `${satuan[n - 10]} belas`;
  if (n < 100) return `${numberToWords(Math.floor(n / 10))} puluh ${numberToWords(n % 10)}`.trim();
  if (n < 200) return `seratus ${numberToWords(n % 100)}`.trim();
  if (n < 1000) return `${numberToWords(Math.floor(n / 100))} ratus ${numberToWords(n % 100)}`.trim();
  if (n < 2000) return `seribu ${numberToWords(n % 1000)}`.trim();
  if (n < 1000000) return `${numberToWords(Math.floor(n / 1000))} ribu ${numberToWords(n % 1000)}`.trim();
  if (n < 1000000000) return `${numberToWords(Math.floor(n / 1000000))} juta ${numberToWords(n % 1000000)}`.trim();
  return `${numberToWords(Math.floor(n / 1000000000))} miliar`.trim();
}