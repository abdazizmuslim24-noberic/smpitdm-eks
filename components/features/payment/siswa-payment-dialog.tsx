"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Upload } from "lucide-react";

interface Ek {
  id: string;
  name: string;
  code: string;
  monthlyFee: number;
}

function defaultPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function SiswaPaymentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ekskuls, setEkskuls] = useState<Ek[]>([]);
  const [form, setForm] = useState({
    extracurricularId: "",
    period: defaultPeriod(),
    paymentMethod: "TRANSFER",
    amount: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/siswa/my-ekskuls")
        .then((r) => r.json())
        .then((data) => {
          const list = data.extracurriculars ?? [];
          setEkskuls(list);
          if (list.length > 0) {
            setForm((f) => ({
              ...f,
              extracurricularId: list[0].id,
              amount: String(list[0].monthlyFee ?? ""),
            }));
          }
        })
        .catch(() => {});
    }
  }, [open]);

  function onEkChange(id: string) {
    const ek = ekskuls.find((e) => e.id === id);
    setForm((f) => ({
      ...f,
      extracurricularId: id,
      amount: ek ? String(ek.monthlyFee ?? "") : f.amount,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("extracurricularId", form.extracurricularId);
    fd.append("period", form.period);
    fd.append("paymentMethod", form.paymentMethod);
    fd.append("amount", String(Number(form.amount) || 0));
    if (file) fd.append("proof", file);

    try {
      const res = await fetch("/api/payments/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim pembayaran.");
        setLoading(false);
        return;
      }
      setOpen(false);
      setFile(null);
      setForm({ extracurricularId: "", period: defaultPeriod(), paymentMethod: "TRANSFER", amount: "" });
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Bayar Iuran
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bayar Iuran Ekstrakurikuler</DialogTitle>
          <DialogDescription>
            Kirim pembayaran dan lampirkan bukti (opsional). Pembayaran menunggu verifikasi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ek">Ekstrakurikuler</Label>
            <Select id="ek" value={form.extracurricularId} onChange={(e) => onEkChange(e.target.value)}>
              {ekskuls.length === 0 && <option value="">Tidak ada ekskul aktif</option>}
              {ekskuls.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="period">Periode (Bulan-Tahun)</Label>
              <Input id="period" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Metode</Label>
              <Select id="method" value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                <option value="TRANSFER">Transfer</option>
                <option value="TUNAI">Tunai</option>
                <option value="LAINNYA">Lainnya</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal (Rp)</Label>
            <Input id="amount" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proof">Bukti Pembayaran (JPG/PNG/PDF, maks 5MB)</Label>
            <Input id="proof" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !form.extracurricularId}>
              {loading && <Loader2 className="animate-spin" />}
              <Upload /> Kirim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
