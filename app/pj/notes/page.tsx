import { sql, eq, inArray, and } from "drizzle-orm";
import { db } from "@/db";
import {
  studentNotes,
  students,
  extracurriculars,
  users,
  memberships,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  NoteFormDialog,
  type NoteEkskulOption,
} from "@/components/features/pj/note-form-dialog";
import {
  NotesTable,
  type PjNoteRow,
} from "@/components/features/pj/notes-table";

export const metadata = { title: "Catatan Siswa" };

export default async function PjNotesPage() {
  const user = await getCurrentUser();
  const ekIds = await getPjEkskulIds(user.id);

  const [ekskulList, memberRows, noteRows] = await Promise.all([
    ekIds.length > 0
      ? db
          .select({ id: extracurriculars.id, name: extracurriculars.name })
          .from(extracurriculars)
          .where(inArray(extracurriculars.id, ekIds))
          .orderBy(sql`${extracurriculars.name} asc`)
      : Promise.resolve([]),
    ekIds.length > 0
      ? db
          .select({
            ekId: memberships.extracurricularId,
            studentId: students.id,
            name: students.name,
            nis: students.nis,
            className: students.className,
          })
          .from(memberships)
          .innerJoin(students, eq(memberships.studentId, students.id))
          .where(
            and(
              inArray(memberships.extracurricularId, ekIds),
              eq(memberships.status, "AKTIF")
            )
          )
          .orderBy(sql`${students.name} asc`)
      : Promise.resolve([]),
    ekIds.length > 0
      ? db
          .select({
            id: studentNotes.id,
            category: studentNotes.category,
            aspect: studentNotes.aspect,
            note: studentNotes.note,
            createdAt: studentNotes.createdAt,
            studentName: students.name,
            nis: students.nis,
            className: students.className,
            ekName: extracurriculars.name,
            authorName: users.name,
          })
          .from(studentNotes)
          .innerJoin(students, eq(studentNotes.studentId, students.id))
          .innerJoin(
            extracurriculars,
            eq(studentNotes.extracurricularId, extracurriculars.id)
          )
          .innerJoin(users, eq(studentNotes.createdBy, users.id))
          .where(inArray(studentNotes.extracurricularId, ekIds))
          .orderBy(sql`${studentNotes.createdAt} desc`)
      : Promise.resolve([]),
  ]);

  const ekskuls: NoteEkskulOption[] = ekskulList.map((ek) => ({
    id: ek.id,
    name: ek.name,
    students: memberRows
      .filter((m) => m.ekId === ek.id)
      .map((m) => ({
        id: m.studentId,
        name: m.name,
        nis: m.nis,
        className: m.className,
      })),
  }));

  const rows = noteRows as PjNoteRow[];

  return (
    <div>
      <PageHeader
        title="Catatan Siswa"
        description="Catat perkembangan atau bimbingan siswa pada setiap ekskul."
        actions={<NoteFormDialog ekskuls={ekskuls} />}
      />
      <NotesTable rows={rows} />
    </div>
  );
}