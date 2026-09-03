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
import { Plus, Loader2, Pencil, Upload, X } from "lucide-react";

export interface ExtracurricularInput {
  id: string;
  code: string;
  name: string;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  monthlyFee: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  qrCodeUrl: string | null;
}

const emptyForm = {
  code: "",
  name: "",
  day: "",
  startTime: "",
  endTime: "",
  location: "",
  monthlyFee: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
};

export function ExtracurricularFormDialog({
  extracurricular,
}: {
  extracurricular?: ExtracurricularInput | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(extracurricular);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          code: extracurricular!.code,
          name: extracurricular!.name,
          day: extracurricular!.day ?? "",
          startTime: extracurricular!.startTime ?? "",
          endTime: extracurricular!.endTime ?? "",
          location: extracurricular!.location ?? "",
          monthlyFee: String(extracurricular!.monthlyFee ?? ""),
          bankName: extracurricular!.bankName ?? "",
          bankAccountNumber: extracurricular!.bankAccountNumber ?? "",
          bankAccountHolder: extracurricular!.bankAccountHolder ?? "",
        }
      : emptyForm
  );

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
    : !removeQr && extracurricular?.qrCodeUrl
      ? extracurricular.qrCodeUrl
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      if (isEdit) fd.append("id", extracurricular!.id);
      fd.append("code", form.code);
      fd.append("name", form.name);
      fd.append("day", form.day);
      fd.append("startTime", form.startTime);
      fd.append("endTime", form.endTime);
      fd.append("location", form.location);
      fd.append("monthlyFee", String(Number(form.monthlyFee) || 0));
      fd.append("bankName", form.bankName);
      fd.append("bankAccountNumber", form.bankAccountNumber);
      fd.append("bankAccountHolder", form.bankAccountHolder);
      if (qrFile) fd.append("qr", qrFile);
      if (isEdit && removeQr) fd.append("removeQr", "true");

      const res = await fetch("/api/admin/extracurriculars", {
        method: isEdit ? "PUT" : "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEdit ? "Gagal memperbarui" : "Gagal menambah") + " ekstrakurikuler.");
        setLoading(false);
        return;
      }
      setOpen(false);
      if (!isEdit) {
        setForm(emptyForm);
        setQrFile(null);
        setRemoveQr(false);
      }
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="sm" variant="outline" className="gap-1">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button>
            <Plus /> Tambah Ekskul
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui data ekstrakurikuler." : "Isi data ekstrakurikuler baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input id="code" value={form.code} onChange={(e) => update("code", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Iuran Bulanan</Label>
              <Input id="fee" value={form.monthlyFee} onChange={(e) => update("monthlyFee", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Ekstrakurikuler</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="day">Hari</Label>
              <Input id="day" value={form.day} onChange={(e) => update("day", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Mulai</Label>
              <Input id="start" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Selesai</Label>
              <Input id="end" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc">Lokasi</Label>
            <Input id="loc" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="font-semibold text-sm">Data Pembayaran (Rekening & QR)</div>
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
