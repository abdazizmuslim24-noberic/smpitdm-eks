import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { studentNotes, extracurriculars, users } from "@/db/schema";
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

  const notes = await db
    .select({
      id: studentNotes.id,
      category: studentNotes.category,
      aspect: studentNotes.aspect,
      note: studentNotes.note,
      createdAt: studentNotes.createdAt,
      ekName: extracurriculars.name,
      authorName: users.name,
    })
    .from(studentNotes)
    .innerJoin(
      extracurriculars,
      eq(studentNotes.extracurricularId, extracurriculars.id)
    )
    .innerJoin(users, eq(studentNotes.createdBy, users.id))
    .where(eq(studentNotes.studentId, student.id))
    .orderBy(sql`${studentNotes.createdAt} desc`);

  return NextResponse.json({ notes });
}