"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export function DownloadReceiptButton({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/receipts/download?id=${encodeURIComponent(paymentId)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error ?? "Gagal mengunduh kuitansi.");
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLoading(false);
    } catch {
      window.alert("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} className="gap-1">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download PDF
    </Button>
  );
}