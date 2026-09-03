# AGENTS.md

## What This Is

SIM-EKSKUL — a school extracurricular management web app. Greenfield project; `PRD-eskulku.md` is the source of truth for all requirements, DB schema, API contracts, RBAC rules, and test cases.

## Tech Stack

- **Next.js 15** (App Router, Server Actions, Route Handlers)
- **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **Drizzle ORM** + **Drizzle Kit** on **Neon PostgreSQL**
- **Zod** for validation
- **ExcelJS** (XLSX export), PDF library (receipts/reports)
- **Vitest** (unit), **Playwright** (e2e), **TestSprite** (e2e via PRD)
- Deploy: **Vercel** (auto-deploy from GitHub master branch) + **Neon** (production branch)

## Deployment Info

| Item | Value |
|---|---|
| Live URL | `https://smpitdm-eks.vercel.app` |
| Vercel user | `abdazizmuslim24-2266` |
| Vercel project | `smpitdm-eks` |
| GitHub repo | `abdazizmuslim24-noberic/smpitdm-eks` (branch `master`, auto-deploy ON) |
| Neon project | `eskulku` (`steep-feather-84578356`), production branch |
| `DATABASE_URL` (pooled) | `postgresql://neondb_owner:npg_UHb3hcn5AFfI@ep-steep-feather-84578356-pooler.us-east-2.aws.neon.tech/smpitdm_eks?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | `postgresql://neondb_owner:npg_UHb3hcn5AFfI@ep-steep-feather-84578356.us-east-2.aws.neon.tech/smpitdm_eks?sslmode=require` |
| `AUTH_SECRET` | `WnS0gGVFKeD8MdQO1CUyJBc9oXRTHjb52sfhlP3EZpYk7ixm` |
| `NEXT_PUBLIC_APP_URL` | `https://smpitdm-eks.vercel.app` |
| `STUDENT_EMAIL_DOMAIN` | `siswa.sch.id` |
| `STUDENT_DEFAULT_PASSWORD` | `siswa123` |

**Note:** `frontend/index.html` is a user-committed static mockup — **never commit it**.

## Seed Accounts

All passwords: `password123`

| Email | Role | Assigned Ekskul |
|---|---|---|
| `admin@example.com` | ADMIN | — |
| `guru1@example.com` | PJ_GURU | Futsal |
| `guru2@example.com` | PJ_GURU | Basket |
| `siswa1@example.com` | SISWA | — |
| `siswa2@example.com` | SISWA | — |

## Seed Extracurriculars

| Name | Code | Bank | Account | QR? |
|---|---|---|---|---|
| Futsal | EKS001 | BCA | 7005936063 / A/N ABDUL AZIZ MUSLIM | ✅ `public/qr-bca.jpeg` |
| Basket | EKS002 | BSI | 1234567890 / A/N Siti Rahma | ❌ |
| Pramuka | EKS003 | — | — | — |
| Tahfidz | EKS004 | — | — | — |

## Database Schema (source of truth: `db/schema.ts`)

> **CRITICAL:** Always refer to `db/schema.ts` as the single source of truth. The PRD database section may be out of date — always cross-check before migration.

### `users`
```
id          text PK
name        text NOT NULL
email       text NOT NULL UNIQUE
password_hash text NOT NULL
role        text enum: ADMIN | PJ_GURU | SISWA default SISWA
is_active   int default 1
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

### `students`
```
id          text PK
user_id     text FK → users.id (set null)
nis         text NOT NULL UNIQUE
name        text NOT NULL
gender      text nullable
class_name  text nullable
phone       text nullable
status      text enum: AKTIF | NONAKTIF | LULUS default AKTIF
created_at  timestamptz default now()
updated_at  timestamptz default now()
```
> **DO NOT ADD `nisn` COLUMN.** It was removed during schema simplification. Students has exactly 10 columns.

### `extracurriculars`
```
id                  text PK
code                text NOT NULL UNIQUE
name                text NOT NULL
description         text nullable
day                 text nullable
start_time          text nullable
end_time            text nullable
location            text nullable
monthly_fee         double default 0
bank_name           text nullable   ← NEW: per-ekskul bank name
bank_account_number text nullable   ← NEW: per-ekskul account number
bank_account_holder text nullable   ← NEW: per-ekskul account holder
qr_code_url         text nullable   ← NEW: per-ekskul QR code image URL
status              text enum: AKTIF | NONAKTIF default AKTIF
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

### `extracurricular_staff`
```
id                  text PK
extracurricular_id  text NOT NULL FK → extracurriculars.id (cascade)
user_id             text NOT NULL FK → users.id (cascade)
created_at          timestamptz default now()
UNIQUE(extracurricular_id, user_id)
```

### `memberships`
```
id                  text PK
student_id          text NOT NULL FK → students.id (cascade)
extracurricular_id  text NOT NULL FK → extracurriculars.id (cascade)
joined_at           timestamptz default now()
status              text enum: AKTIF | NONAKTIF | KELUAR default AKTIF
created_at          timestamptz default now()
updated_at          timestamptz default now()
UNIQUE(student_id, extracurricular_id)
```

### `meetings`
```
id                  text PK
extracurricular_id  text NOT NULL FK → extracurriculars.id (cascade)
meeting_date        timestamptz NOT NULL
start_time          text nullable
end_time            text nullable
topic               text NOT NULL
location            text nullable
status              text enum: DIJADWALKAN | BERLANGSUNG | SELESAI | DIBATALKAN default DIJADWALKAN
notes               text nullable
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

### `attendance`
```
id          text PK
meeting_id  text NOT NULL FK → meetings.id (cascade)
student_id  text NOT NULL FK → students.id (cascade)
status      text enum: H | I | S | A | T default H
notes       text nullable
recorded_by text FK → users.id (set null)
created_at  timestamptz default now()
updated_at  timestamptz default now()
UNIQUE(meeting_id, student_id)
```

### `payments`
```
id                  text PK
student_id          text NOT NULL FK → students.id (cascade)
extracurricular_id  text NOT NULL FK → extracurriculars.id (cascade)
period              text NOT NULL
payment_date        timestamptz NOT NULL
amount              double NOT NULL
payment_method      text enum: TUNAI | TRANSFER | LAINNYA default TUNAI
reference_number    text nullable
proof_file          text nullable
status              text enum: MENUNGGU_VERIFIKASI | LUNAS | DITOLAK default MENUNGGU_VERIFIKASI
verification_note   text nullable
verified_by         text FK → users.id (set null)
verified_at         timestamptz nullable
created_by          text FK → users.id (set null)
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

### `payment_receipts`
```
id            text PK
payment_id    text NOT NULL FK → payments.id (cascade)
receipt_number text NOT NULL
file_url      text nullable
generated_at  timestamptz default now()
UNIQUE(payment_id)
```

## Roles & RBAC

Three roles: `ADMIN`, `PJ_GURU`, `SISWA`. Every API endpoint and server action **must** check role + resource ownership server-side — never rely on frontend hiding alone.

- **Admin**: full access to all data.
- **PJ_GURU**: scoped to extracurriculars they are assigned to via `extracurricular_staff`. Must verify `extracurricular_id` matches their assignment before allowing any operation (meetings, attendance, payments, verification, **payment config**). Return 403 otherwise.
- **SISWA**: can only view own data (attendance, payments, receipts). Can upload payment proof. Can view per-ekskul bank/payment info.

Ownership check flow for PJ: `current_user → role=PJ_GURU → check extracurricular_id → assigned? → allow/403`.

## Payment Configuration (per-Extracurricular)

Each extracurricular has optional bank/QR fields (`bank_name`, `bank_account_number`, `bank_account_holder`, `qr_code_url`). These are set by Admin (via extracurricular form) or PJ (via `/pj/ekskuls` settings page). QR is optional — if absent, the app displays account number only.

### Files involved

| File | Purpose |
|---|---|
| `components/forms/extracurricular-form-dialog.tsx` | Admin form with bank fields + QR upload |
| `app/api/admin/extracurriculars/route.ts` | Admin API: POST/PUT accepts FormData (bank fields + QR file) |
| `app/pj/ekskuls/page.tsx` | PJ settings page (server component, shows bank/QR per ekskul) |
| `components/features/pj/ekskul-payment-dialog.tsx` | PJ dialog for editing bank/QR |
| `app/api/pj/ekskuls/route.ts` | PJ API: GET (bank fields) + PUT (RBAC per-ekskul) |
| `app/api/siswa/my-ekskuls/route.ts` | Siswa API: returns bank fields for each ekskul |
| `app/siswa/payments/page.tsx` | Siswa payment page: per-ekskul bank/QR info panel + download |
| `components/features/siswa/siswa-payment-dialog.tsx` | Siswa payment dialog: shows bank/QR info for selected ekskul |
| `lib/pdf/generate-receipt.ts` | Receipt PDF: includes "Dibayar Melalui" bank/QR section |

## Key Database Constraints

These are enforced at DB level — do not skip:

- `memberships`: `UNIQUE(student_id, extracurricular_id)`
- `attendance`: `UNIQUE(meeting_id, student_id)`
- `extracurricular_staff`: `UNIQUE(extracurricular_id, user_id)`
- `students.nis`: `UNIQUE`
- `extracurriculars.code`: `UNIQUE`
- `users.email`: `UNIQUE`

Bulk attendance inserts must use a transaction (BEGIN/COMMIT, ROLLBACK on failure).

## API Routes

### Admin (`/api/admin/`)
- `/api/admin/users` — CRUD users
- `/api/admin/students` — CRUD students (no `nisn` field)
- `/api/admin/extracurriculars` — CRUD extracurriculars + bank/QR (FormData with file upload)
- `/api/admin/meetings` — CRUD meetings (POST/PUT/DELETE)
- `/api/admin/payments` — list + create manual payments
- `/api/admin/audit` — view all verification audit

### PJ (`/api/pj/`)
- `/api/pj/dashboard` — PJ dashboard stats
- `/api/pj/ekskuls` — GET (bank fields) + PUT (bank/QR config for assigned ekskul)
- `/api/pj/meetings` — CRUD meetings (scoped to assigned ekskul)
- `/api/pj/payments` — list + verify/reject payments (scoped)

### Siswa (`/api/siswa/`)
- `/api/siswa/dashboard` — Siswa dashboard
- `/api/siswa/my-ekskuls` — list enrolled ekskul with bank/QR info
- `/api/siswa/attendance` — own attendance
- `/api/siswa/payments` — own payments
- `/api/siswa/meetings` — meetings for enrolled ekskul

### Export (`/api/export/`)
- `/api/export/attendance/xlsx`
- `/api/export/attendance/pdf`
- `/api/export/payment/pdf` — receipt PDF (includes bank/QR info)

### Public
- `/api/health` — health check

## File Upload Rules

- Allowed for payment proof: `image/jpeg`, `image/png`, `application/pdf` — max 5MB
- Allowed for QR code: `image/jpeg`, `image/png` — max 5MB
- Validate MIME type server-side; never trust client filename
- **STORAGE: base64 data URI disimpan langsung di kolom PostgreSQL (GRATIS, tanpa object storage).**
  - `extracurriculars.qr_code_url` → `data:<mime>;base64,...`
  - `payments.proof_file` → `data:<mime>;base64,...`
- TIDAK menulis ke filesystem (`public/uploads/`) — gagal di Vercel serverless (read-only). Jangan gunakan Vercel Blob/R2/Supabase (bukan free).
- File lama tidak lagi dihapus dari disk (tidak ada disk); cukup set kolom ke NULL.
- Render langsung via `img src` / `a href` — data URI kompatibel tanpa frontend change.

## Payment Verification Rules

- Statuses: `MENUNGGU_VERIFIKASI` → `LUNAS` or `DITOLAK`
- Admin can verify any payment; PJ only for their assigned extracurricular
- Rejection **requires** `verification_note`
- Every verification stores `verified_by` + `verified_at` (audit trail)
- Receipt PDF only generated when status = `LUNAS`
- Receipt PDF includes: bank name, account number, account holder if available

## Folder Structure

```
app/
├── login/page.tsx
├── admin/
│   ├── dashboard/page.tsx
│   ├── users/page.tsx
│   ├── students/page.tsx
│   ├── extracurriculars/page.tsx
│   ├── meetings/page.tsx
│   ├── attendance/page.tsx
│   ├── payments/page.tsx
│   └── audit/page.tsx
├── pj/
│   ├── dashboard/page.tsx
│   ├── ekskuls/page.tsx          ← NEW: bank/QR settings
│   ├── meetings/page.tsx
│   ├── attendance/page.tsx
│   ├── payments/page.tsx
│   └── reports/page.tsx
├── siswa/
│   ├── dashboard/page.tsx
│   ├── attendance/page.tsx
│   ├── payments/page.tsx         ← includes per-ekskul bank/QR panel
│   └── receipts/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── health/route.ts
│   ├── admin/users/route.ts
│   ├── admin/students/route.ts
│   ├── admin/extracurriculars/route.ts
│   ├── admin/meetings/route.ts
│   ├── admin/payments/route.ts
│   ├── admin/audit/route.ts
│   ├── pj/dashboard/route.ts
│   ├── pj/ekskuls/route.ts       ← NEW: GET + PUT bank/QR
│   ├── pj/meetings/route.ts
│   ├── pj/payments/route.ts
│   ├── siswa/dashboard/route.ts
│   ├── siswa/my-ekskuls/route.ts ← expanded: bank fields
│   ├── siswa/attendance/route.ts
│   ├── siswa/payments/route.ts
│   ├── siswa/meetings/route.ts
│   └── export/attendance/route.ts
│   └── export/payment/route.ts
├── icon.png                       ← favicon
├── layout.tsx
└── globals.css

components/
├── ui/                            ← shadcn/ui components
├── layout/
│   ├── app-shell.tsx
│   ├── sidebar-nav.tsx
│   └── brand-logo.tsx            ← reusable logo component
├── forms/
│   ├── extracurricular-form-dialog.tsx  ← includes bank fields + QR upload
│   ├── student-form-dialog.tsx
│   └── meeting-form-dialog.tsx    ← includes edit/delete support
├── features/
│   ├── pj/
│   │   └── ekskul-payment-dialog.tsx    ← NEW: PJ bank/QR edit dialog
│   └── siswa/
│       └── siswa-payment-dialog.tsx     ← includes bank/QR info
├── dashboard/                     ← stat-card, chart components
└── tables/                        ← data table components

lib/
├── auth/                          ← NextAuth config
├── rbac/                          ← role checking utilities
├── permissions/
├── validation/                    ← Zod schemas (NO nisn field in student schema)
├── pdf/
│   └── generate-receipt.ts       ← receipt PDF with bank/QR info
├── excel/
├── nav.ts                         ← nav items per role (includes "Pengaturan Ekskul" for PJ)
├── icons.ts                       ← Lucide icon imports (includes CreditCard)
└── utils.ts

db/
├── schema.ts                      ← DRIZZLE SCHEMA (single source of truth)
├── index.ts                       ← db connection
└── seed.ts

public/
├── logo-sekolah.png               ← school emblem (app logo)
├── qr-bca.jpeg                    ← BCA QR code image (seed)
└── uploads/                       ← filesystem uploads (TIDAK DIPAKAI, read-only di Vercel)
```

> **PENTING:** `public/uploads/` tidak dipakai untuk menyimpan upload. Semua file upload (QR & bukti pembayaran) disimpan sebagai base64 data URI di kolom PostgreSQL.

## Development Phases

1. **Foundation** ✅ — project setup, Next.js, Neon DB, Drizzle schema + migrations, auth, RBAC
2. **Master Data** ✅ — users, students, extracurriculars (with bank/QR fields), PJ assignment, memberships
3. **Attendance** ✅ — meetings (CRUD with edit/delete), attendance CRUD, anti-duplicate, weekly/monthly recaps
4. **Export** ✅ — XLSX + PDF (with bank/QR info in receipts)
5. **Payments** ✅ — manual payments, upload proof, verification/rejection, audit trail, receipt PDF, per-ekskul payment config, PJ settings page
6. **Testing** ⬜ — Drizzle DB tests, Vitest unit, API tests, Playwright, TestSprite, security tests
7. **UI Polish** ✅ — branding (EKSKUL), school emblem logo, favicon, QR in transfer instructions

## Current Deployment Status

- Vercel auto-deploy: ON (master branch)
- DB migrated and seeded ✅
- All features above deployed and working ✅
