import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  payments,
  paymentReceipts,
  extracurriculars,
  students,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { PrintButton } from "@/components/features/receipt/print-button";
import { DownloadReceiptButton } from "@/components/features/receipt/download-receipt-button";
import { ReceiptView } from "@/components/features/receipt/receipt-view";

export const metadata = { title: "Kuitansi" };

export default async function AdminReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  if (!hasPermission(session.role, "receipts.view")) {
    notFound();
  }

  const { id: paymentId } = await params;

  const [row] = await db
    .select({
      receiptNumber: paymentReceipts.receiptNumber,
      generatedAt: paymentReceipts.generatedAt,
      studentName: students.name,
      ekName: extracurriculars.name,
      period: payments.period,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      verifiedByName: users.name,
    })
    .from(paymentReceipts)
    .innerJoin(payments, eq(paymentReceipts.paymentId, payments.id))
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .leftJoin(users, eq(payments.verifiedBy, users.id))
    .where(and(eq(payments.id, paymentId), eq(payments.status, "LUNAS")))
    .limit(1);

  if (!row) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-xl font-bold">Kuitansi Pembayaran</h1>
        <div className="flex items-center gap-2">
          <DownloadReceiptButton paymentId={paymentId} />
          <PrintButton />
        </div>
      </div>

      <ReceiptView data={row} />
    </div>
  );
}