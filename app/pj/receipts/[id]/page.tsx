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
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions/rbac";
import { pjIsAssigned } from "@/lib/pj-scope";
import { PrintButton } from "@/components/features/receipt/print-button";
import { DownloadReceiptButton } from "@/components/features/receipt/download-receipt-button";
import { ReceiptView } from "@/components/features/receipt/receipt-view";

export const metadata = { title: "Kuitansi" };

export default async function PjReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!hasPermission(user.role, "receipts.view")) {
    notFound();
  }

  const { id: paymentId } = await params;

  const [payment] = await db
    .select({
      id: payments.id,
      extracurricularId: payments.extracurricularId,
    })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) {
    notFound();
  }

  // Ownership check: PJ only for their assigned extracurricular
  const assigned = await pjIsAssigned(user.id, payment.extracurricularId);
  if (!assigned) {
    notFound();
  }

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