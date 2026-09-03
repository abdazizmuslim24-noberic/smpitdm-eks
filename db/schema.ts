import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * SIM-EKSKUL — SMPITDM EKS Database Schema (Drizzle ORM)
 * Mirrors PRD section 32.
 */

/* ---------- Enums as union types ---------- */
export const USER_ROLES = ["ADMIN", "PJ_GURU", "SISWA"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const STUDENT_STATUS = ["AKTIF", "NONAKTIF", "LULUS"] as const;
export type StudentStatus = (typeof STUDENT_STATUS)[number];

export const MEMBERSHIP_STATUS = ["AKTIF", "NONAKTIF", "KELUAR"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[number];

export const EXTRACURRICULAR_STATUS = ["AKTIF", "NONAKTIF"] as const;
export type ExtracurricularStatus = (typeof EXTRACURRICULAR_STATUS)[number];

export const MEETING_STATUS = [
  "DIJADWALKAN",
  "BERLANGSUNG",
  "SELESAI",
  "DIBATALKAN",
] as const;
export type MeetingStatus = (typeof MEETING_STATUS)[number];

export const ATTENDANCE_STATUS = ["H", "I", "S", "A", "T"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const PAYMENT_STATUS = [
  "MENUNGGU_VERIFIKASI",
  "LUNAS",
  "DITOLAK",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_METHOD = ["TUNAI", "TRANSFER", "LAINNYA"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];

/* ---------- Tables ---------- */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: USER_ROLES }).notNull().default("SISWA"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)]
);

export const students = pgTable(
  "students",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    nis: text("nis").notNull(),
    name: text("name").notNull(),
    gender: text("gender"),
    className: text("class_name"),
    phone: text("phone"),
    status: text("status", { enum: STUDENT_STATUS })
      .notNull()
      .default("AKTIF"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("students_nis_unique").on(t.nis)]
);

export const extracurriculars = pgTable(
  "extracurriculars",
  {
    id: text("id").primaryKey().notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    day: text("day"),
    startTime: text("start_time"),
    endTime: text("end_time"),
    location: text("location"),
    monthlyFee: doublePrecision("monthly_fee").notNull().default(0),
    bankName: text("bank_name"),
    bankAccountNumber: text("bank_account_number"),
    bankAccountHolder: text("bank_account_holder"),
    qrCodeUrl: text("qr_code_url"),
    status: text("status", { enum: EXTRACURRICULAR_STATUS })
      .notNull()
      .default("AKTIF"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("extracurriculars_code_unique").on(t.code)]
);

export const extracurricularStaff = pgTable(
  "extracurricular_staff",
  {
    id: text("id").primaryKey().notNull(),
    extracurricularId: text("extracurricular_id")
      .notNull()
      .references(() => extracurriculars.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("esc_staff_unique").on(t.extracurricularId, t.userId),
  ]
);

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey().notNull(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    extracurricularId: text("extracurricular_id")
      .notNull()
      .references(() => extracurriculars.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: text("status", { enum: MEMBERSHIP_STATUS })
      .notNull()
      .default("AKTIF"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_student_ekskul_unique").on(
      t.studentId,
      t.extracurricularId
    ),
  ]
);

export const meetings = pgTable(
  "meetings",
  {
    id: text("id").primaryKey().notNull(),
    extracurricularId: text("extracurricular_id")
      .notNull()
      .references(() => extracurriculars.id, { onDelete: "cascade" }),
    meetingDate: timestamp("meeting_date", { withTimezone: true }).notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    topic: text("topic").notNull(),
    location: text("location"),
    status: text("status", { enum: MEETING_STATUS })
      .notNull()
      .default("DIJADWALKAN"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("meetings_extracurricular_idx").on(t.extracurricularId)]
);

export const attendance = pgTable(
  "attendance",
  {
    id: text("id").primaryKey().notNull(),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: text("status", { enum: ATTENDANCE_STATUS }).notNull().default("H"),
    notes: text("notes"),
    recordedBy: text("recorded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("attendance_meeting_student_unique").on(t.meetingId, t.studentId)]
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey().notNull(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    extracurricularId: text("extracurricular_id")
      .notNull()
      .references(() => extracurriculars.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    amount: doublePrecision("amount").notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHOD })
      .notNull()
      .default("TUNAI"),
    referenceNumber: text("reference_number"),
    proofFile: text("proof_file"),
    status: text("status", { enum: PAYMENT_STATUS })
      .notNull()
      .default("MENUNGGU_VERIFIKASI"),
    verificationNote: text("verification_note"),
    verifiedBy: text("verified_by").references(() => users.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payments_student_idx").on(t.studentId), index("payments_ekskul_idx").on(t.extracurricularId)]
);

export const paymentReceipts = pgTable(
  "payment_receipts",
  {
    id: text("id").primaryKey().notNull(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    receiptNumber: text("receipt_number").notNull(),
    fileUrl: text("file_url"),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("receipts_payment_unique").on(t.paymentId)]
);

/* ---------- Relations ---------- */
export const usersRelations = relations(users, ({ many, one }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  staffAssignments: many(extracurricularStaff),
  recordedAttendance: many(attendance, { relationName: "recordedBy" }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  memberships: many(memberships),
  attendanceRecords: many(attendance),
  payments: many(payments),
}));

export const extracurricularsRelations = relations(
  extracurriculars,
  ({ many }) => ({
    staff: many(extracurricularStaff),
    memberships: many(memberships),
    meetings: many(meetings),
    payments: many(payments),
  })
);

export const extracurricularStaffRelations = relations(
  extracurricularStaff,
  ({ one }) => ({
    extracurricular: one(extracurriculars, {
      fields: [extracurricularStaff.extracurricularId],
      references: [extracurriculars.id],
    }),
    user: one(users, {
      fields: [extracurricularStaff.userId],
      references: [users.id],
    }),
  })
);

export const membershipsRelations = relations(memberships, ({ one }) => ({
  student: one(students, {
    fields: [memberships.studentId],
    references: [students.id],
  }),
  extracurricular: one(extracurriculars, {
    fields: [memberships.extracurricularId],
    references: [extracurriculars.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  extracurricular: one(extracurriculars, {
    fields: [meetings.extracurricularId],
    references: [extracurriculars.id],
  }),
  attendanceRecords: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  meeting: one(meetings, {
    fields: [attendance.meetingId],
    references: [meetings.id],
  }),
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  recorder: one(users, {
    fields: [attendance.recordedBy],
    references: [users.id],
    relationName: "recordedBy",
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  extracurricular: one(extracurriculars, {
    fields: [payments.extracurricularId],
    references: [extracurriculars.id],
  }),
  verifier: one(users, {
    fields: [payments.verifiedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
  receipts: many(paymentReceipts),
}));

export const paymentReceiptsRelations = relations(
  paymentReceipts,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentReceipts.paymentId],
      references: [payments.id],
    }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type Extracurricular = typeof extracurriculars.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payment = typeof payments.$inferSelect;
