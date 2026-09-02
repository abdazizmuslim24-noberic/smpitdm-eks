import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  payments,
  paymentReceipts,
  extracurriculars,
  students,
  users,
} from "@/db/schema";
import type { ReceiptData } from "@/components/features/receipt/receipt-view";

/**
 * Load LUNAS receipt data for a payment. Caller is responsible for
 * ownership/RBAC authorization (PJ scoped by extracurricular, etc.).
 */
export async function getLunasReceipt(paymentId: string): Promise<ReceiptData | null> {
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
      extracurricularId: payments.extracurricularId,
    })
    .from(paymentReceipts)
    .innerJoin(payments, eq(paymentReceipts.paymentId, payments.id))
    .innerJoin(students, eq(payments.studentId, students.id))
    .innerJoin(extracurriculars, eq(payments.extracurricularId, extracurriculars.id))
    .leftJoin(users, eq(payments.verifiedBy, users.id))
    .where(and(eq(payments.id, paymentId), eq(payments.status, "LUNAS")))
    .limit(1);

  if (!row) return null;

  return {
    receiptNumber: row.receiptNumber,
    generatedAt: row.generatedAt,
    studentName: row.studentName,
    ekName: row.ekName,
    period: row.period,
    amount: row.amount,
    paymentDate: row.paymentDate,
    verifiedByName: row.verifiedByName,
    extracurricularId: row.extracurricularId,
  };
}