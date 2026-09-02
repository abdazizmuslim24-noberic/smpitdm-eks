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
import { Plus, Loader2, Pencil } from "lucide-react";
import type { MeetingStatus } from "@/db/schema";

interface Ek {
  id: string;
  name: string;
}

export interface MeetingInput {
  id: string;
  topic: string;
  meetingDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  status: MeetingStatus;
  extracurricularId: string;
}

interface MeetingFormDialogProps {
  ekskulEndpoint?: string;
  meeting?: MeetingInput | null;
}

interface MeetingFormState {
  extracurricularId: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  topic: string;
  location: string;
  status: string;
}

function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const tz = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );
  return tz.toISOString().slice(0, 10);
}

const emptyForm: MeetingFormState = {
  extracurricularId: "",
  meetingDate: "",
  startTime: "",
  endTime: "",
  topic: "",
  location: "",
  status: "DIJADWALKAN",
};

export function MeetingFormDialog({
  ekskulEndpoint = "/api/admin/master-options",
  meeting,
}: MeetingFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(meeting);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ekskuls, setEkskuls] = useState<Ek[]>([]);
  const [form, setForm] = useState<MeetingFormState>(() =>
    isEdit
      ? {
          extracurricularId: meeting!.extracurricularId,
          meetingDate: toDateInputValue(meeting!.meetingDate),
          startTime: meeting!.startTime ?? "",
          endTime: meeting!.endTime ?? "",
          topic: meeting!.topic,
          location: meeting!.location ?? "",
          status: meeting!.status,
        }
      : { ...emptyForm }
  );

  useEffect(() => {
    if (open) {
      fetch(ekskulEndpoint)
        .then((r) => r.json())
        .then((data) => {
          setEkskuls(data.extracurriculars ?? []);
          if (isEdit) {
            setForm((f) =>
              data.extracurriculars?.some(
                (e: Ek) => e.id === f.extracurricularId
              )
                ? f
                : { ...f, extracurricularId: data.extracurriculars?.[0]?.id ?? "" }
            );
          } else if (data.extracurriculars?.length > 0) {
            setForm((f) => ({ ...f, extracurricularId: data.extracurriculars[0].id }));
          }
        })
        .catch(() => {});
    }
  }, [open, ekskulEndpoint, isEdit]);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meetings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: meeting!.id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan pertemuan.");
        setLoading(false);
        return;
      }
      setOpen(false);
      if (!isEdit) setForm({ ...emptyForm });
      router.refresh();
      setLoading(false);
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
            <Plus /> Buat Pertemuan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Pertemuan" : "Buat Pertemuan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui jadwal pertemuan ekstrakurikuler."
              : "Jadwalkan pertemuan ekstrakurikuler baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ek">Ekstrakurikuler</Label>
            <Select id="ek" value={form.extracurricularId} onChange={(e) => update("extracurricularId", e.target.value)} disabled={isEdit}>
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
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="DIJADWALKAN">Dijadwalkan</option>
                <option value="BERLANGSUNG">Berlangsung</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !form.extracurricularId}>
              {loading && <Loader2 className="animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
