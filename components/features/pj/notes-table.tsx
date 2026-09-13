"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface PjNoteRow {
  id: string;
  category: string;
  aspect: string;
  note: string;
  createdAt: Date;
  studentName: string;
  nis: string;
  className: string | null;
  ekName: string;
  authorName: string;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "default" }
> = {
  PERKEMBANGAN: { label: "Perkembangan", variant: "success" },
  PERLU_BIMBINGAN: { label: "Butuh Bimbingan", variant: "warning" },
};

export function NotesTable({ rows }: { rows: PjNoteRow[] }) {
  const router = useRouter();
  const [ekFilter, setEkFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const ekOptions = Array.from(new Set(rows.map((r) => r.ekName))).sort();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!ekFilter || r.ekName === ekFilter) &&
          (!catFilter || r.category === catFilter)
      ),
    [rows, ekFilter, catFilter]
  );

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus catatan ini?")) return;
    const res = await fetch(`/api/pj/notes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Gagal menghapus catatan.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-end gap-3 border-b p-3">
        {ekOptions.length > 1 && (
          <div className="space-y-1">
            <Label htmlFor="ekFilter">Filter Ekstrakurikuler</Label>
            <Select
              id="ekFilter"
              value={ekFilter}
              onChange={(e) => setEkFilter(e.target.value)}
              className="w-56"
            >
              <option value="">Semua Ekstrakurikuler</option>
              {ekOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="catFilter">Filter Kategori</Label>
          <Select
            id="catFilter"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-44"
          >
            <option value="">Semua Kategori</option>
            {Object.entries(CATEGORY_MAP).map(([value, m]) => (
              <option key={value} value={value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} catatan
        </div>
      </div>
      <div className="overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Ekstrakurikuler</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Aspek / Kegiatan</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Belum ada catatan siswa.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((n) => {
              const cat = CATEGORY_MAP[n.category] ?? {
                label: n.category,
                variant: "default" as const,
              };
              return (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">
                    {n.studentName}
                    <span className="block text-xs text-muted-foreground">
                      {n.nis}
                      {n.className ? ` · ${n.className}` : ""}
                    </span>
                  </TableCell>
                  <TableCell>{n.ekName}</TableCell>
                  <TableCell>
                    <Badge variant={cat.variant}>{cat.label}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{n.aspect}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal">{n.note}</TableCell>
                  <TableCell>{n.createdAt.toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive"
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}