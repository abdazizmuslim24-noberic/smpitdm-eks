import { NextResponse } from "next/server";
import { getLunasReceipt } from "@/lib/receipt-data";
import { buildReceiptPdf, receiptFileName } from "@/lib/pdf/receipt";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { getCurrentUser } from "@/lib/auth/current-user";
import { pjIsAssigned } from "@/lib/pj-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireRole(["ADMIN", "PJ_GURU"]);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const data = await getLunasReceipt(id);
  if (!data) {
    return NextResponse.json(
      { error: "Kuitansi tidak ditemukan." },
      { status: 404 }
    );
  }

  // RBAC / ownership
  if (session.role === "ADMIN") {
    if (!hasPermission(session.role, "receipts.view")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  } else {
    if (!hasPermission(session.role, "receipts.view")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const user = await getCurrentUser();
    const assigned = await pjIsAssigned(user.id, data.extracurricularId!);
    if (!assigned) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  const pdf = await buildReceiptPdf(data);
  const body = new Uint8Array(pdf);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receiptFileName(data)}"`,
      "Cache-Control": "no-store",
    },
  });
}