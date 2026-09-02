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
import { Plus, Loader2, Pencil } from "lucide-react";

export interface ExtracurricularInput {
  id: string;
  code: string;
  name: string;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  monthlyFee: number;
}

const emptyForm = {
  code: "",
  name: "",
  day: "",
  startTime: "",
  endTime: "",
  location: "",
  monthlyFee: "",
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
        }
      : emptyForm
  );

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/extracurriculars", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: extracurricular!.id } : {}),
          ...form,
          monthlyFee: Number(form.monthlyFee) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEdit ? "Gagal memperbarui" : "Gagal menambah") + " ekstrakurikuler.");
        setLoading(false);
        return;
      }
      setOpen(false);
      if (!isEdit) setForm(emptyForm);
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
      <DialogContent>
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
