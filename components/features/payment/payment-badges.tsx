import { Badge } from "@/components/ui/badge";

export function PaymentMethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    TUNAI: "Tunai",
    TRANSFER: "Transfer",
    LAINNYA: "Lainnya",
  };
  return <span>{map[method] ?? method}</span>;
}

export function PaymentStatusBadge({
  status,
}: {
  status: "MENUNGGU_VERIFIKASI" | "LUNAS" | "DITOLAK";
}) {
  if (status === "LUNAS") {
    return <Badge variant="success">Lunas</Badge>;
  }
  if (status === "DITOLAK") {
    return <Badge variant="destructive">Ditolak</Badge>;
  }
  return <Badge variant="warning">Menunggu</Badge>;
}
