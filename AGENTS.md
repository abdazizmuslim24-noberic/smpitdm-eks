# AGENTS.md

## What This Is

SIM-EKSKUL — a school extracurricular management web app. Greenfield project; `PRD-eskulku.md` is the source of truth for all requirements, DB schema, API contracts, RBAC rules, and test cases.

## Tech Stack

- **Next.js** (App Router, Server Actions, Route Handlers)
- **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **Drizzle ORM** + **Drizzle Kit** on **Neon PostgreSQL**
- **Zod** for validation
- **ExcelJS** (XLSX export), PDF library for reports/receipts
- **Vitest** (unit), **Playwright** (e2e), **TestSprite** (e2e via PRD)
- Deploy: **Vercel** + **Neon**

## Roles & RBAC (Critical)

Three roles: `ADMIN`, `PJ_GURU`, `SISWA`. Every API endpoint and server action **must** check role + resource ownership server-side — never rely on frontend hiding alone.

- **Admin**: full access to all data.
- **PJ_GURU**: scoped to extracurriculars they are assigned to via `extracurricular_staff`. Must verify `extracurricular_id` matches their assignment before allowing any operation (meetings, attendance, payments, verification). Return 403 otherwise.
- **SISWA**: can only view own data (attendance, payments, receipts). Can upload payment proof.

Ownership check flow for PJ: `current_user → role=PJ_GURU → check extracurricular_id → assigned? → allow/403`.

## Key Database Constraints

These are enforced at DB level — do not skip:

- `memberships`: `UNIQUE(student_id, extracurricular_id)`
- `attendance`: `UNIQUE(meeting_id, student_id)`
- `extracurricular_staff`: `UNIQUE(extracurricular_id, user_id)`

Bulk attendance inserts must use a transaction (BEGIN/COMMIT, ROLLBACK on failure).

## Development Phases

Follow this order — each phase depends on the previous:

1. **Foundation**: project setup, Next.js, Neon DB, Drizzle schema + migrations, auth, RBAC
2. **Master Data**: users, students, extracurriculars, PJ assignment, memberships
3. **Attendance**: meetings, attendance CRUD, anti-duplicate, weekly/monthly recaps
4. **Export**: XLSX + PDF
5. **Payments**: manual payments, upload proof, verification/rejection, audit trail, receipt PDF
6. **Testing**: Drizzle DB tests, Vitest unit, API tests, Playwright, TestSprite, security tests

## Payment Verification Rules

- Statuses: `MENUNGGU_VERIFIKASI` → `LUNAS` or `DITOLAK`
- Admin can verify any payment; PJ only for their assigned extracurricular
- Rejection **requires** `verification_note`
- Every verification stores `verified_by` + `verified_at` (audit trail)
- Receipt PDF only generated when status = `LUNAS`

## File Upload

- Allowed: `image/jpeg`, `image/png`, `application/pdf` — max 5MB
- Validate MIME type server-side; never trust client filename
- Generate safe filenames; restrict access by ownership

## Seed Data

Development seed accounts: `admin@example.com` (ADMIN), `guru1@example.com` / `guru2@example.com` (PJ_GURU), `siswa1@example.com` / `siswa2@example.com` (SISWA). Ekskul: Futsal, Basket, Pramuka, Tahfidz. Guru 1 → Futsal, Guru 2 → Basket. Never use seed passwords in production.

## Folder Structure

```
app/           — Next.js App Router (login, admin/, pj/, siswa/, api/)
components/    — ui/, forms/, tables/, dashboard/
lib/           — auth/, rbac/, permissions/, validation/, pdf/, excel/
db/            — schema.ts, index.ts, seed.ts (Drizzle)
drizzle/       — migrations/
tests/         — unit/, integration/, e2e/
testsprite/    — auth/, rbac/, attendance/, payment/, reports/
```

Route groups: `/admin/*` (Admin), `/pj/*` (PJ_Guru), `/siswa/*` (Siswa). Login redirects by role to the correct dashboard.
