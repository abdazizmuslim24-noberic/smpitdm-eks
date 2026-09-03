"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2, Upload, X } from "lucide-react";

export interface EkskulPaymentData {
  id: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  qrCodeUrl: string | null;
}

export function EkskulPaymentDialog({ ekskul }: { ekskul: EkskulPaymentData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [form, setForm] = useState({
    bankName: ekskul.bankName ?? "",
    bankAccountNumber: ekskul.bankAccountNumber ?? "",
    bankAccountHolder: ekskul.bankAccountHolder ?? "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setQrFile(file);
    if (file) setRemoveQr(false);
  }

  function handleRemoveQr() {
    setQrFile(null);
    setRemoveQr(true);
  }

  const qrPreview = qrFile
    ? URL.createObjectURL(qrFile)
    : !removeQr && ekskul.qrCodeUrl
      ? ekskul.qrCodeUrl
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("id", ekskul.id);
      fd.append("bankName", form.bankName);
      fd.append("bankAccountNumber", form.bankAccountNumber);
      fd.append("bankAccountHolder", form.bankAccountHolder);
      if (qrFile) fd.append("qr", qrFile);
      if (removeQr) fd.append("removeQr", "true");

      const res = await fetch("/api/pj/ekskuls", { method: "PUT", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memperbarui pembayaran ekskul.");
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Pencil className="h-4 w-4" /> Edit Rekening
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Data Pembayaran Ekskul</DialogTitle>
          <DialogDescription>
            Atur rekening &amp; QR pembayaran untuk ekskul ini. Perubahan langsung tampil untuk siswa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input id="bankName" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="contoh: BCA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">No. Rekening</Label>
              <Input id="bankAccountNumber" value={form.bankAccountNumber} onChange={(e) => update("bankAccountNumber", e.target.value)} placeholder="contoh: 7005936063" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountHolder">A.N. Pemilik Rekening</Label>
            <Input id="bankAccountHolder" value={form.bankAccountHolder} onChange={(e) => update("bankAccountHolder", e.target.value)} placeholder="contoh: ABDUL AZIZ MUSLIM" />
          </div>

          <div className="space-y-2">
            <Label>Kode QR (opsional)</Label>
            {qrPreview ? (
              <div className="flex items-start gap-3">
                <img src={qrPreview} alt="Preview QR" className="h-24 w-24 rounded-md border border-border object-contain bg-white" />
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-semibold hover:bg-accent">
                    <Upload className="h-4 w-4" /> Ganti QR
                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleQrChange} />
                  </label>
                  <Button type="button" size="sm" variant="outline" className="gap-1 text-xs" onClick={handleRemoveQr}>
                    <X className="h-4 w-4" /> Hapus QR
                  </Button>
                </div>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
                <Upload className="h-4 w-4" /> Upload QR
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleQrChange} />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              JPG / PNG, maks 5 MB. Jika tidak diisi, siswa hanya melihat nomor rekening.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
