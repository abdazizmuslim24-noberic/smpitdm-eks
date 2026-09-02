"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import {
  ExtracurricularFormDialog,
  type ExtracurricularInput,
} from "./extracurricular-form-dialog";

export function ExtracurricularRowActions({
  extracurricular,
}: {
  extracurricular: ExtracurricularInput;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `Hapus ekstrakurikuler "${extracurricular.name}"?\nSeluruh data terkait (anggota, pertemuan, absensi, pembayaran) juga akan dihapus permanen.`
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/extracurriculars?id=${encodeURIComponent(extracurricular.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Gagal menghapus ekstrakurikuler.");
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
      <ExtracurricularFormDialog extracurricular={extracurricular} />
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