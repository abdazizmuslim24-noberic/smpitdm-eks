import { sql, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { memberships, students, extracurriculars } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPjEkskulIds } from "@/lib/pj-scope";
import { PageHeader } from "@/components/dashboard/page-header";
import { MembershipFormDialog } from "@/components/features/admin/membership-form-dialog";
import { MembershipTable } from "@/components/features/membership-table";

export const metadata = { title: "Keanggotaan" };

export default async function PjMembershipsPage() {
  const user = await getCurrentUser();
  const ekIds = await getPjEkskulIds(user.id);

  const rows =
    ekIds.length > 0
      ? await db
          .select({
            id: memberships.id,
            studentId: memberships.studentId,
            extracurricularId: memberships.extracurricularId,
            studentName: students.name,
            nis: students.nis,
            className: students.className,
            ekName: extracurriculars.name,
            status: memberships.status,
            joinedAt: memberships.joinedAt,
          })
          .from(memberships)
          .innerJoin(students, eq(memberships.studentId, students.id))
          .innerJoin(
            extracurriculars,
            eq(memberships.extracurricularId, extracurriculars.id)
          )
          .where(inArray(memberships.extracurricularId, ekIds))
          .orderBy(sql`${students.name} asc`)
      : [];

  return (
    <div>
      <PageHeader
        title="Keanggotaan"
        description="Kelola anggota untuk ekskul yang Anda bina."
        actions={<MembershipFormDialog />}
      />
      <MembershipTable rows={rows} />
    </div>
  );
}
