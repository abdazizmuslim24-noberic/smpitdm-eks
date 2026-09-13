"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export interface NoteEkskulOption {
  id: string;
  name: string;
  students: { id: string; name: string; nis: string; className: string | null }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  PERKEMBANGAN: "Perkembangan",
  PERLU_BIMBINGAN: "Butuh Bimbingan",
};

export function NoteFormDialog({ ekskuls }: { ekskuls: NoteEkskulOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracurricularId, setExtracurricularId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [category, setCategory] = useState("PERKEMBANGAN");
  const [aspect, setAspect] = useState("");
  const [note, setNote] = useState("");

  const students = useMemo(() => {
    const ek = ekskuls.find((e) => e.id === extracurricularId);
    return ek ? ek.students : [];
  }, [ekskuls, extracurricularId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pj/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          extracurricularId,
          category,
          aspect,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah catatan.");
        setLoading(false);
        return;
      }
      setOpen(false);
      setStudentId("");
      setAspect("");
      setNote("");
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
          <Plus /> Catat Siswa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Catatan Siswa</DialogTitle>
          <DialogDescription>
            Pilih siswa dan kategori perkembangan. Contoh: siswa menunjukkan
            perkembangan / butuh bimbingan di PBB dasar 2.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ek">Ekstrakurikuler</Label>
            <Select
              id="ek"
              value={extracurricularId}
              onChange={(e) => {
                setExtracurricularId(e.target.value);
                setStudentId("");
              }}
              required
            >
              <option value="">Pilih ekskul</option>
              {ekskuls.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="student">Siswa</Label>
            <Select
              id="student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">{extracurricularId ? "Pilih siswa" : "Pilih ekskul dulu"}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nis})
                  {s.className ? ` — ${s.className}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect">Aspek / Kegiatan</Label>
            <Input
              id="aspect"
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              placeholder="Contoh: PBB dasar 2"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Catatan</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Siswa menunjukkan perkembangan yang baik dalam gerakan dasar baris-berbaris."
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !studentId || !aspect.trim()}>
              {loading && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}