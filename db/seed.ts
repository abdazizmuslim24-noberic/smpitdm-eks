import "./load-env";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "./index";
import { hashPassword } from "../lib/auth/password";
import {
  users,
  students,
  extracurriculars,
  extracurricularStaff,
  memberships,
  meetings,
  attendance,
  payments,
} from "./schema";

/**
 * Development seed data (see AGENTS.md / PRD section 7).
 * NEVER use the seed password (password123) in production.
 */
const PASSWORD = "password123";

async function upsertUser(
  email: string,
  name: string,
  role: "ADMIN" | "PJ_GURU" | "SISWA"
) {
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }
  const [u] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name,
      email,
      passwordHash: hashPassword(PASSWORD),
      role,
      isActive: 1,
    })
    .returning();
  return u.id;
}

async function upsertStudent(nis: string, data: Omit<typeof students.$inferInsert, "id" | "nis">) {
  const existing = await db
    .select()
    .from(students)
    .where(eq(students.nis, nis))
    .limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }
  const [s] = await db
    .insert(students)
    .values({ id: randomUUID(), nis, ...data })
    .returning();
  return s.id;
}

async function upsertExtracurricular(code: string, name: string) {
  const existing = await db
    .select()
    .from(extracurriculars)
    .where(eq(extracurriculars.code, code))
    .limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }
  const [e] = await db
    .insert(extracurriculars)
    .values({
      id: randomUUID(),
      code,
      name,
      monthlyFee: 50000,
      status: "AKTIF",
    })
    .returning();
  return e.id;
}

async function main() {
  console.log("Seeding database...");

  const adminId = await upsertUser("admin@example.com", "Administrator", "ADMIN");
  const guru1Id = await upsertUser("guru1@example.com", "Budi Santoso", "PJ_GURU");
  const guru2Id = await upsertUser("guru2@example.com", "Siti Rahma", "PJ_GURU");
  const siswa1Id = await upsertUser("siswa1@example.com", "Ahmad Fauzi", "SISWA");
  const siswa2Id = await upsertUser("siswa2@example.com", "Dewi Lestari", "SISWA");

  const futsalId = await upsertExtracurricular("FUT", "Futsal");
  const basketId = await upsertExtracurricular("BSK", "Basket");
  const pramukaId = await upsertExtracurricular("PRM", "Pramuka");
  await upsertExtracurricular("THF", "Tahfidz");

  // PJ assignments: Guru1 -> Futsal, Guru2 -> Basket
  const staff = await db
    .select()
    .from(extracurricularStaff)
    .where(eq(extracurricularStaff.userId, guru1Id))
    .limit(1);
  if (staff.length === 0) {
    await db.insert(extracurricularStaff).values([
      { id: randomUUID(), extracurricularId: futsalId, userId: guru1Id },
      { id: randomUUID(), extracurricularId: basketId, userId: guru2Id },
    ]);
  }

  const siswa1StudentId = await upsertStudent("1001", {
    userId: siswa1Id,
    name: "Ahmad Fauzi",
    gender: "L",
    className: "7A",
    status: "AKTIF",
  });
  const siswa2StudentId = await upsertStudent("1002", {
    userId: siswa2Id,
    name: "Dewi Lestari",
    gender: "P",
    className: "7A",
    status: "AKTIF",
  });

  // Memberships
  const m1 = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.studentId, siswa1StudentId),
        eq(memberships.extracurricularId, futsalId)
      )
    )
    .limit(1);
  if (m1.length === 0) {
    await db.insert(memberships).values([
      { id: randomUUID(), studentId: siswa1StudentId, extracurricularId: futsalId, status: "AKTIF" },
      { id: randomUUID(), studentId: siswa1StudentId, extracurricularId: pramukaId, status: "AKTIF" },
      { id: randomUUID(), studentId: siswa2StudentId, extracurricularId: basketId, status: "AKTIF" },
    ]);
  }

  // Meetings + attendance for Futsal
  const existingMeeting = await db
    .select()
    .from(meetings)
    .where(eq(meetings.extracurricularId, futsalId))
    .limit(1);
  if (existingMeeting.length === 0) {
    const [meet] = await db
      .insert(meetings)
      .values({
        id: randomUUID(),
        extracurricularId: futsalId,
        meetingDate: new Date(),
        topic: "Latihan Rutin Futsal",
        location: "Lapangan Sekolah",
        status: "SELESAI",
      })
      .returning();

    const att = await db
      .select()
      .from(attendance)
      .where(eq(attendance.meetingId, meet.id))
      .limit(1);
    if (att.length === 0) {
      await db.insert(attendance).values({
        id: randomUUID(),
        meetingId: meet.id,
        studentId: siswa1StudentId,
        status: "H",
        recordedBy: guru1Id,
      });
    }

    // A payment for siswa1 -> Futsal (LUNAS to show receipts)
    const pay = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, siswa1StudentId))
      .limit(1);
    if (pay.length === 0) {
      await db.insert(payments).values({
        id: randomUUID(),
        studentId: siswa1StudentId,
        extracurricularId: futsalId,
        period: "2026-08",
        paymentDate: new Date(),
        amount: 50000,
        paymentMethod: "TUNAI",
        status: "MENUNGGU_VERIFIKASI",
        createdBy: siswa1Id,
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin id:   ${adminId}`);
  console.log(`Logins (password ${PASSWORD}):`);
  console.log(`  admin@example.com (Admin)`);
  console.log(`  guru1@example.com (PJ Guru1)`);
  console.log(`  guru2@example.com (PJ Guru2)`);
  console.log(`  siswa1@example.com (Siswa)`);
  console.log(`  siswa2@example.com (Siswa)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
