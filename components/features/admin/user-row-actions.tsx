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
import { Loader2, CircleCheck, CircleX, KeyRound, Trash2 } from "lucide-react";
import { UserFormDialog, type UserInput } from "./user-form-dialog";

export function UserRowActions({ user }: { user: UserInput }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const active = user.isActive === 1;

  async function handleToggle() {
    const action = active ? "Nonaktifkan" : "Aktifkan";
    const ok = window.confirm(
      `${action} akun "${user.name}"?\n` +
        (active
          ? "Akun nonaktif tidak dapat login ke sistem."
          : "Akun aktif kembali dan dapat login ke sistem.")
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? `Gagal ${action.toLowerCase()} akun.`);
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      window.alert("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      `Hapus akun "${user.name}"?\nTindakan ini tidak dapat dibatalkan.`
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Gagal menghapus akun.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      window.alert("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setResetLoading(true);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Gagal mereset kata sandi.");
        setResetLoading(false);
        return;
      }
      setPassword("");
      setResetOpen(false);
      router.refresh();
    } catch {
      window.alert("Terjadi kesalahan jaringan.");
      setResetLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <UserFormDialog user={user} />
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1">
            <KeyRound className="h-4 w-4" /> Reset Password
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi: {user.name}</DialogTitle>
            <DialogDescription>
              Masukkan kata sandi baru untuk akun ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi Baru</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading && <Loader2 className="animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        size="sm"
        variant={active ? "outline" : "success"}
        className="gap-1"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : active ? (
          <CircleX className="h-4 w-4" />
        ) : (
          <CircleCheck className="h-4 w-4" />
        )}
        {active ? "Nonaktifkan" : "Aktifkan"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1"
        onClick={handleDelete}
        disabled={loading}
        title="Hapus akun"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Hapus
      </Button>
    </div>
  );
}