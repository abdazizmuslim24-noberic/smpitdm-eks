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
import { Plus, Loader2 } from "lucide-react";

interface Ek {
  id: string;
  name: string;
}

export function MeetingFormDialog({ ekskulEndpoint = "/api/admin/master-options" }: { ekskulEndpoint?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ekskuls, setEkskuls] = useState<Ek[]>([]);
  const [form, setForm] = useState({
    extracurricularId: "",
    meetingDate: "",
    startTime: "",
    endTime: "",
    topic: "",
    location: "",
  });

  useEffect(() => {
    if (open) {
      fetch(ekskulEndpoint)
        .then((r) => r.json())
        .then((data) => {
          setEkskuls(data.extracurriculars ?? []);
          if (data.extracurriculars?.length > 0) {
            setForm((f) => ({ ...f, extracurricularId: data.extracurriculars[0].id }));
          }
        })
        .catch(() => {});
    }
  }, [open, ekskulEndpoint]);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat pertemuan.");
        setLoading(false);
        return;
      }
      setOpen(false);
      setForm({ extracurricularId: "", meetingDate: "", startTime: "", endTime: "", topic: "", location: "" });
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
          <Plus /> Buat Pertemuan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Pertemuan</DialogTitle>
          <DialogDescription>Jadwalkan pertemuan ekstrakurikuler baru.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ek">Ekstrakurikuler</Label>
            <Select id="ek" value={form.extracurricularId} onChange={(e) => update("extracurricularId", e.target.value)}>
              {ekskuls.length === 0 && <option value="">Tidak ada ekskul aktif</option>}
              {ekskuls.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topik</Label>
            <Input id="topic" value={form.topic} onChange={(e) => update("topic", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" type="date" value={form.meetingDate} onChange={(e) => update("meetingDate", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Mulai</Label>
              <Input id="start" type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Selesai</Label>
              <Input id="end" type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
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
            <Button type="submit" disabled={loading || !form.extracurricularId}>
              {loading && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
