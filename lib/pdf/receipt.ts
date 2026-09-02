import PDFDocument from "pdfkit";
import type { ReceiptData } from "@/components/features/receipt/receipt-view";
import { formatRupiah, numberToWords } from "@/components/features/receipt/receipt-view";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateShort(d: Date): string {
  return d.toLocaleDateString("id-ID");
}

export function buildReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 48 * 2;

    // Header
    doc.fontSize(16).fillColor("#111827").text("SMPITDM EKS", { continued: false });
    doc.fontSize(10).fillColor("#6b7280").text("Sistem Manajemen Ekstrakurikuler Sekolah");
    doc.moveDown(0.5);

    doc.fontSize(8).fillColor("#6b7280").text("Nomor Kuitansi", { align: "right" });
    doc.fontSize(11).fillColor("#111827").font("Helvetica-Bold").text(
      data.receiptNumber,
      { align: "right" }
    );
    doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(fmtDate(data.generatedAt), { align: "right" });

    // Divider under header
    doc.moveDown(0.5);
    doc.moveTo(48, doc.y).lineTo(48 + pageWidth, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.moveDown(1);

    // Info rows
    const rows: [string, string][] = [
      ["Diterima Dari", data.studentName],
      ["Ekstrakurikuler", data.ekName],
      ["Periode", data.period],
      ["Tanggal Pembayaran", fmtDateShort(data.paymentDate)],
    ];
    for (const [label, value] of rows) {
      const rowY = doc.y;
      doc.fontSize(10).fillColor("#6b7280").text(label, 48, rowY);
      doc.font("Helvetica-Bold").fillColor("#111827").fontSize(10).text(
        value,
        48,
        rowY,
        { align: "right", width: pageWidth }
      );
      doc.font("Helvetica");
      doc.moveDown(0.8);
    }

    doc.moveDown(0.5);
    doc.moveTo(48, doc.y).lineTo(48 + pageWidth, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.moveDown(1);

    // Total
    const totalLabelY = doc.y;
    doc.fontSize(11).fillColor("#111827").text("Total Pembayaran", 48, totalLabelY);
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#111827").text(
      formatRupiah(data.amount),
      48,
      totalLabelY - 4,
      { lineBreak: false, align: "right", width: pageWidth }
    );
    doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text(
      `${numberToWords(data.amount)} rupiah`,
      48,
      totalLabelY + 26,
      { width: pageWidth, align: "right" }
    );
    doc.y = Math.max(doc.y, totalLabelY + 40);

    // Signature block (right aligned)
    const sigBase = 660;
    doc.fontSize(9).fillColor("#6b7280").text(
      "Dibayar & Diverifikasi",
      48,
      sigBase,
      { lineBreak: false, align: "right", width: pageWidth }
    );
    doc.moveTo(pageWidth - 90, sigBase + 28).lineTo(pageWidth + 12, sigBase + 28).strokeColor("#111827").lineWidth(1).stroke();
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(
      data.verifiedByName ?? "Administrator",
      48,
      sigBase + 34,
      { lineBreak: false, align: "right", width: pageWidth }
    );

    doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(
      "Kuitansi ini dihasilkan otomatis oleh SMPITDM EKS.",
      48,
      760,
      { align: "center", width: pageWidth }
    );

    doc.end();
  });
}

export function receiptFileName(data: ReceiptData): string {
  const clean = data.studentName.replace(/\s+/g, "_");
  return `kuitansi_${clean}_${data.receiptNumber}.pdf`;
}