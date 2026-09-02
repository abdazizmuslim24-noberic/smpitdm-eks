"use client";

import { useState } from "react";
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
import { Plus, Loader2, Pencil } from "lucide-react";

export interface StudentInput {
  id: string;
  nis: string;
  name: string;
  gender: string | null;
  className: string | null;
  status: string;
}

export function StudentFormDialog({ student }: { student?: StudentInput | null }) {
  const router = useRouter();
  const isEdit = Boolean(student);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          nis: student!.nis,
          name: student!.name,
          gender: student!.gender ?? "L",
          className: student!.className ?? "",
          status: student!.status ?? "AKTIF",
        }
      : { nis: "", name: "", gender: "L", className: "", status: "AKTIF" }
  );

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: student!.id } : {}),
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEdit ? "Gagal memperbarui" : "Gagal menambah") + " siswa.");
        setLoading(false);
        return;
      }
      setOpen(false);
      if (!isEdit) setForm({ nis: "", name: "", gender: "L", className: "", status: "AKTIF" });
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
            <Plus /> Tambah Siswa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui data siswa." : "Isi data siswa baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nis">NIS</Label>
            <Input id="nis" value={form.nis} onChange={(e) => update("nis", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <Select id="gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Input id="class" value={form.className} onChange={(e) => update("className", e.target.value)} />
            </div>
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF</option>
                <option value="LULUS">LULUS</option>
              </Select>
            </div>
          )}

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