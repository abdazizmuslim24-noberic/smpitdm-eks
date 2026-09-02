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
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { PrintButton } from "@/components/features/receipt/print-button";
import { ReceiptView } from "@/components/features/receipt/receipt-view";

export const metadata = { title: "Kuitansi" };

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: paymentId } = await params;
  const user = await getCurrentUser();
  const student = await getStudentForUser(user.id);

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
    .where(
      and(
        eq(payments.id, paymentId),
        eq(payments.studentId, student.id),
        eq(payments.status, "LUNAS")
      )
    )
    .limit(1);

  if (!row) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Kuitansi Pembayaran</h1>
        <PrintButton />
      </div>

      <ReceiptView data={row} />
    </div>
  );
}
