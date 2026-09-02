"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

export function PaymentVerifyDialog({
  paymentId,
  student,
  amount,
}: {
  paymentId: string;
  student: string;
  amount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function handle(action: "approve" | "reject") {
    if (action === "reject" && !note.trim()) {
      setError("Catatan penolakan wajib diisi.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal verifikasi.");
        setLoading(false);
        return;
      }
      setOpen(false);
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
        <Button size="sm" className="gap-1">
          <ShieldCheck className="h-4 w-4" /> Verifikasi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          <DialogDescription>
            Konfirmasi pembayaran <strong>{student}</strong> sebesar{" "}
            <strong>Rp {amount.toLocaleString("id-ID")}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Catatan Verifikasi</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wajib diisi saat menolak pembayaran"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Approve → Lunas</Badge>
            <Badge variant="destructive">Reject → Ditolak</Badge>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => handle("reject")}
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin" />}
            Tolak
          </Button>
          <Button
            variant="success"
            onClick={() => handle("approve")}
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin" />}
            <CheckCircle2 /> Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
