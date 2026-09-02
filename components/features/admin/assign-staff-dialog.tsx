"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { UserPlus, Loader2 } from "lucide-react";

interface PjUser {
  id: string;
  name: string;
  email: string;
}

export function AssignStaffDialog({
  extracurricularId,
  extracurricularName,
}: {
  extracurricularId: string;
  extracurricularName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pjUsers, setPjUsers] = useState<PjUser[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/admin/pj-users")
        .then((r) => r.json())
        .then((data) => {
          setPjUsers(data.users ?? []);
          if (data.users?.length > 0) setSelected(data.users[0].id);
        })
        .catch(() => setPjUsers([]));
    }
  }, [open]);

  async function handleAssign() {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracurricularId, userId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menugaskan.");
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus /> Tugaskan PJ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tugaskan PJ/Guru</DialogTitle>
          <DialogDescription>
            Pilih PJ/Guru untuk ekstrakurikuler {extracurricularName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {pjUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada pengguna dengan peran PJ/Guru. Buat pengguna PJ/Guru terlebih dahulu.
            </p>
          ) : (
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {pjUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </Select>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleAssign} disabled={loading || pjUsers.length === 0}>
            {loading && <Loader2 className="animate-spin" />}
            Tugaskan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
