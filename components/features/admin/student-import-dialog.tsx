"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, Loader2, CheckCircle2 } from "lucide-react";

interface ImportResult {
  total: number;
  insertedCount: number;
  errorCount: number;
  errors?: { row: number; message: string }[];
}

export function StudentImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleDownloadTemplate() {
    window.location.href = "/api/admin/students/template";
  }

  async function handleImport() {
    if (!file) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengimpor siswa.");
        setLoading(false);
        return;
      }
      setResult(data);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setError(null);
          setResult(null);
          setFile(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Upload className="h-4 w-4" /> Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Siswa (Excel)</DialogTitle>
          <DialogDescription>
            File berisi kolom <strong>NIS</strong>, <strong>Nama</strong>,{" "}
            <strong>Kelas</strong>. Sistem akan otomatis membuat akun login untuk
            setiap siswa dengan email <code>nis@siswa.sch.id</code> dan password
            default. Maksimal <strong>30 siswa</strong> per file — pecah menjadi
            beberapa file jika lebih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="link"
            className="gap-1 px-0"
            onClick={handleDownloadTemplate}
          >
            <Download className="h-4 w-4" /> Unduh Template Excel
          </Button>

          <div className="space-y-2">
            <Label htmlFor="file">File Excel (.xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-md border bg-card p-3 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> Import selesai
              </div>
              <p>
                Total <strong>{result.total}</strong> baris · Berhasil{" "}
                <strong>{result.insertedCount}</strong> · Gagal{" "}
                <strong>{result.errorCount}</strong>
              </p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-muted-foreground">
                      Baris {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Tutup
          </Button>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading && <Loader2 className="animate-spin" />}
            Import Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
