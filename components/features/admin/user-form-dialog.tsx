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

export interface UserInput {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: number;
}

export function UserFormDialog({ user }: { user?: UserInput | null }) {
  const router = useRouter();
  const isEdit = Boolean(user);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name: user!.name,
          email: user!.email,
          password: "",
          role: user!.role,
        }
      : { name: "", email: "", password: "", role: "PJ_GURU" }
  );

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isEdit && (!form.name || !form.email || !form.password)) return;
    setLoading(true);
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = "/api/admin/users";
      const body: Record<string, unknown> = isEdit
        ? { id: user!.id, name: form.name, email: form.email, role: form.role }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEdit ? "Gagal memperbarui" : "Gagal membuat") + " pengguna.");
        setLoading(false);
        return;
      }
      setOpen(false);
      if (!isEdit) setForm({ name: "", email: "", password: "", role: "PJ_GURU" });
      router.refresh();
      setLoading(false);
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
            <Plus /> Tambah Pengguna
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data akun pengguna."
              : "Buat akun pengguna baru. Akun siswa dibuat otomatis saat menambah data siswa."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Peran</Label>
            <Select
              id="role"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              <option value="PJ_GURU">PJ / Guru</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nama lengkap"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="nama@sekolah.sch.id"
              required
            />
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {isEdit ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}