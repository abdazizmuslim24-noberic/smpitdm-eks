import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { memberships, extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getStudentForUser } from "@/lib/auth/student-resolver";

export async function GET() {
  const user = await getCurrentUser();
  if (user.role !== "SISWA") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  const student = await getStudentForUser(user.id);
  if (!student) {
    return NextResponse.json(
      { error: "Profil siswa belum terhubung ke akun ini." },
      { status: 404 }
    );
  }

  const ekskuls = await db
    .select({
      id: extracurriculars.id,
      name: extracurriculars.name,
      code: extracurriculars.code,
      monthlyFee: extracurriculars.monthlyFee,
    })
    .from(memberships)
    .innerJoin(extracurriculars, eq(memberships.extracurricularId, extracurriculars.id))
    .where(
      and(
        eq(memberships.studentId, student.id),
        eq(memberships.status, "AKTIF")
      )
    );

  return NextResponse.json({ extracurriculars: ekskuls });
}
