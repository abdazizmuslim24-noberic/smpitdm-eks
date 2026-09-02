"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export function MeetingDeleteButton({
  id,
  topic,
  status,
}: {
  id: string;
  topic: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status !== "SELESAI") return null;

  async function handleDelete() {
    const ok = window.confirm(
      `Hapus kegiatan "${topic}"?\nKegiatan berstatus SELESAI akan dihapus permanen, termasuk data absensinya.`
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/meetings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Gagal menghapus kegiatan.");
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
    <Button
      size="sm"
      variant="destructive"
      className="gap-1"
      onClick={handleDelete}
      disabled={loading}
      title="Hapus kegiatan (SELESAI)"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Hapus
    </Button>
  );
}