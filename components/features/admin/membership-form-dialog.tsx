"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

interface Option {
  id: string;
  name: string;
  nis?: string;
}

export interface MembershipInput {
  id: string;
  studentId: string;
  extracurricularId: string;
  status: string;
}

export function MembershipFormDialog({
  membership,
}: {
  membership?: MembershipInput | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(membership);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Option[]>([]);
  const [ekskuls, setEkskuls] = useState<Option[]>([]);
  const [studentId, setStudentId] = useState(membership?.studentId ?? "");
  const [extracurricularId, setExtracurricularId] = useState(
    membership?.extracurricularId ?? ""
  );
  const [status, setStatus] = useState(membership?.status ?? "AKTIF");

  useEffect(() => {
    if (open) {
      fetch("/api/admin/master-options")
        .then((r) => r.json())
        .then((data) => {
          setStudents(data.students ?? []);
          setEkskuls(data.extracurriculars ?? []);
          if (!studentId && data.students?.length > 0)
            setStudentId(data.students[0].id);
          if (!extracurricularId && data.extracurriculars?.length > 0)
            setExtracurricularId(data.extracurriculars[0].id);
        })
        .catch(() => {});
    }
  }, [open, studentId, extracurricularId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/memberships", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: membership!.id } : {}),
          studentId,
          extracurricularId,
          ...(isEdit ? { status } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEdit ? "Gagal memperbarui" : "Gagal menambah") + " keanggotaan.");
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
        {isEdit ? (
          <Button size="sm" variant="outline" className="gap-1">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button>
            <Plus /> Tambah Keanggotaan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Keanggotaan" : "Tambah Keanggotaan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui siswa, ekstrakurikuler, atau status keanggotaan."
              : "Daftarkan siswa ke ekstrakurikuler."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Siswa</Label>
            <Select id="student" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              {students.length === 0 && <option value="">Tidak ada siswa aktif</option>}
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nis})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ek">Ekstrakurikuler</Label>
            <Select id="ek" value={extracurricularId} onChange={(e) => setExtracurricularId(e.target.value)} required>
              {ekskuls.length === 0 && <option value="">Tidak ada ekskul aktif</option>}
              {ekskuls.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF</option>
                <option value="KELUAR">KELUAR</option>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !studentId || !extracurricularId}>
              {loading && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}