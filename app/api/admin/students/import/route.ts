import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "@/db";
import { users, students } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions/rbac";
import { hashPasswordAsync } from "@/lib/auth/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STUDENT_EMAIL_DOMAIN =
  process.env.STUDENT_EMAIL_DOMAIN || "siswa.sch.id";
const DEFAULT_PASSWORD =
  process.env.STUDENT_DEFAULT_PASSWORD || "";
const MAX_IMPORT_ROWS = 30;

function normalizeEmail(nis: string): string {
  return `${nis.trim()}@${STUDENT_EMAIL_DOMAIN}`.toLowerCase();
}

function normalizeClassName(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

interface RowResult {
  row: number;
  message: string;
}

/**
 * Compute N scrypt hashes in parallel. Async scrypt uses the libuv threadpool
 * (4 threads by default), so ~4x faster than scryptSync for bulk imports.
 */
async function hashAll(count: number, password: string): Promise<string[]> {
  const result = new Array<string>(count);
  let idx = 0;
  const concurrency = 4;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < count) {
      const i = idx++;
      result[i] = await hashPasswordAsync(password);
    }
  });
  await Promise.all(workers);
  return result;
}

export async function POST(request: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!hasPermission(session.role, "students.manage")) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  if (!DEFAULT_PASSWORD) {
    return NextResponse.json(
      { error: "STUDENT_DEFAULT_PASSWORD belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File wajib diunggah." }, { status: 400 });
  }

  const ALLOWED =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (file.type !== ALLOWED) {
    return NextResponse.json(
      { error: "Format file harus .xlsx (Excel)." },
      { status: 400 }
    );
  }

  let wb: ExcelJS.Workbook;
  try {
    const buf = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as never);
  } catch {
    return NextResponse.json({ error: "File Excel tidak dapat dibaca." }, { status: 400 });
  }

  const ws = wb.worksheets[0];
  if (!ws) {
    return NextResponse.json({ error: "File Excel kosong." }, { status: 400 });
  }

  // Parse rows (skip header). Each row: [NIS, Nama, Kelas]
  const rowsByNumber = new Map<number, { nis: string; name: string; className: string | null }>();
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const nis = String(row.getCell(1).value ?? "").trim();
    const name = String(row.getCell(2).value ?? "").trim();
    if (!nis && !name) return;
    rowsByNumber.set(rowNumber, { nis, name, className: normalizeClassName(row.getCell(3).value) });
  });

  if (rowsByNumber.size === 0) {
    return NextResponse.json({ error: "Tidak ada data siswa untuk diimport." }, { status: 400 });
  }

  if (rowsByNumber.size > MAX_IMPORT_ROWS) {
    return NextResponse.json(
      {
        error: `Maksimal ${MAX_IMPORT_ROWS} siswa per import. File berisi ${rowsByNumber.size} siswa. Silakan pecah menjadi beberapa file.`,
      },
      { status: 400 }
    );
  }

  const results: RowResult[] = [];

  // 1. Structural validation (per row)
  const seenNis = new Set<string>();
  for (const [rowNumber, r] of rowsByNumber) {
    if (!r.nis) results.push({ row: rowNumber, message: "NIS kosong." });
    if (!r.name) results.push({ row: rowNumber, message: "Nama kosong." });
    if (r.nis && seenNis.has(r.nis)) {
      results.push({ row: rowNumber, message: `NIS ${r.nis} duplikat dalam file.` });
    }
    if (r.nis) seenNis.add(r.nis);
  }

  // Rows with structural errors are skipped
  const structurallyInvalidRows = new Set(
    results.map((e) => e.row)
  );
  const candidates = [...rowsByNumber.entries()].filter(
    ([rowNumber]) => !structurallyInvalidRows.has(rowNumber)
  );

  // 2. Database duplicate check
  if (candidates.length > 0) {
    const nisList = candidates.map(([, r]) => r.nis);
    const emailList = candidates.map(([, r]) => normalizeEmail(r.nis));

    const [dbStudents, dbUsers] = await Promise.all([
      db.select({ nis: students.nis }).from(students).where(inArray(students.nis, nisList)),
      db.select({ email: users.email }).from(users).where(inArray(users.email, emailList)),
    ]);

    const nisSet = new Set(dbStudents.map((s) => s.nis));
    const emailSet = new Set(dbUsers.map((u) => u.email));

    const toInsert: { rowNumber: number; nis: string; name: string; className: string | null }[] = [];
    for (const [rowNumber, r] of candidates) {
      if (nisSet.has(r.nis)) {
        results.push({ row: rowNumber, message: `NIS ${r.nis} sudah terdaftar.` });
      } else if (emailSet.has(normalizeEmail(r.nis))) {
        results.push({ row: rowNumber, message: `Email ${normalizeEmail(r.nis)} sudah terdaftar.` });
      } else {
        toInsert.push({ rowNumber, nis: r.nis, name: r.name, className: r.className });
      }
    }

    // 3. Insert in transaction
    if (toInsert.length > 0) {
      // Precompute password hashes concurrently (scrypt via async uses threadpool)
      const hashedPasswords = await hashAll(toInsert.length, DEFAULT_PASSWORD);

      await db.transaction(async (tx) => {
        for (let i = 0; i < toInsert.length; i++) {
          const item = toInsert[i];
          const userId = randomUUID();
          await tx.insert(users).values({
            id: userId,
            name: item.name,
            email: normalizeEmail(item.nis),
            passwordHash: hashedPasswords[i],
            role: "SISWA",
            isActive: 1,
          });
          await tx.insert(students).values({
            id: randomUUID(),
            userId,
            nis: item.nis,
            name: item.name,
            className: item.className,
            status: "AKTIF",
          });
        }
      });
    }
  }

  const errorCount = results.length;
  const insertedCount =
    rowsByNumber.size - errorCount;

  return NextResponse.json({
    ok: true,
    total: rowsByNumber.size,
    insertedCount,
    errorCount,
    errors: results,
  });
}
