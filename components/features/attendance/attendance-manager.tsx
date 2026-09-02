"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: { key: string; label: string; short: string }[] = [
  { key: "H", label: "Hadir", short: "H" },
  { key: "I", label: "Izin", short: "I" },
  { key: "S", label: "Sakit", short: "S" },
  { key: "A", label: "Alpa", short: "A" },
  { key: "T", label: "Terlambat", short: "T" },
];

const chipClass: Record<string, string> = {
  H: "bg-success text-success-foreground",
  I: "bg-primary text-primary-foreground",
  S: "bg-warning text-warning-foreground",
  A: "bg-destructive text-destructive-foreground",
  T: "bg-secondary text-secondary-foreground",
};

interface StudentRow {
  id: string;
  name: string;
  nis: string;
  status: string;
}

interface MeetingInfo {
  id: string;
  topic: string;
  date: string;
  status: string;
}

export function AttendanceManager({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/attendance?meeting=${meetingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setMeeting({
          id: data.meeting.id,
          topic: data.meeting.topic,
          date: data.meeting.date,
          status: data.meeting.status,
        });
        setStudents(data.students.map((s: StudentRow) => ({ ...s, status: s.status || "H" })));
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat data absensi.");
        setLoading(false);
      });
  }, [meetingId]);

  function setStatus(studentId: string, status: string) {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          records: students.map((s) => ({ studentId: s.id, status: s.status })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan absensi.");
        setSaving(false);
        return;
      }
      router.refresh();
      setSaving(false);
    } catch {
      setError("Terjadi kesalahan.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin h-6 w-6" /> Memuat...
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        {error ?? "Pertemuan tidak ditemukan."}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">{meeting.topic}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {new Date(meeting.date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>·</span>
            <Badge variant={meeting.status === "SELESAI" ? "success" : "default"}>{meeting.status}</Badge>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          <Save /> Simpan Absensi
        </Button>
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Tidak ada anggota aktif untuk pertemuan ini.
                  </TableCell>
                </TableRow>
              )}
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.nis}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {STATUSES.map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setStatus(s.id, st.key)}
                          className={cn(
                            "h-8 w-8 rounded-md text-sm font-semibold transition-colors",
                            s.status === st.key
                              ? chipClass[st.key]
                              : "bg-muted text-muted-foreground hover:bg-muted/70"
                          )}
                          title={st.label}
                        >
                          {st.short}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
