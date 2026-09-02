"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { StudentFormDialog, type StudentInput } from "./student-form-dialog";

export function StudentRowActions({ student }: { student: StudentInput }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Hapus siswa "${student.name}"?\nKeanggotaan, absensi, dan riwayat pembayaran yang terkait juga akan dihapus.`
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/students?id=${encodeURIComponent(student.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Gagal menghapus siswa.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      window.alert("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <StudentFormDialog student={student} />
      <Button
        size="sm"
        variant="destructive"
        className="gap-1"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Hapus
      </Button>
    </div>
  );
}