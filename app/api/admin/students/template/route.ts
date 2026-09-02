import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!hasPermission(session.role, "students.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Siswa");

  ws.columns = [
    { header: "NIS", key: "nis", width: 16 },
    { header: "Nama", key: "name", width: 32 },
    { header: "Kelas", key: "className", width: 12 },
  ];

  ws.addRow({ nis: "123456", name: "Contoh Siswa", className: "7A" });

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_import_siswa.xlsx"',
    },
  });
}
