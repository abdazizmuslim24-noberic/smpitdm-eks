# PRD — SIM-EKSKUL
## Sistem Manajemen Ekstrakurikuler Sekolah Berbasis Web

**Versi:** 1.0  
**Tanggal:** 1 September 2026  
**Status:** Draft siap development  
**Platform:** Web Responsive  
**Fokus MVP:** Absensi pertemuan mingguan, rekap, pembayaran manual, verifikasi pembayaran, dan laporan.

---

## 1. Ringkasan Produk

SIM-EKSKUL adalah aplikasi web sederhana untuk membantu sekolah mengelola kegiatan ekstrakurikuler secara terpusat.

Sistem dirancang untuk tiga jenis pengguna:

1. **Admin**
2. **PJ/Guru Ekskul**
3. **Siswa**

Peran **PJ Ekskul adalah guru/pembina yang bertanggung jawab terhadap ekstrakurikuler tertentu**. PJ/Guru memiliki hak untuk mengelola pertemuan, absensi, melihat rekap, serta **memverifikasi atau menolak pembayaran siswa untuk ekskul yang menjadi tanggung jawabnya**.

Fokus utama MVP:

- RBAC dan login multi-user
- CRUD data utama
- Manajemen ekstrakurikuler
- Keanggotaan siswa
- Pertemuan mingguan
- Absensi
- Rekap mingguan dan bulanan
- Export XLS/XLSX
- Export PDF
- Pembayaran manual
- Upload/penyimpanan bukti pembayaran
- Verifikasi pembayaran oleh Admin atau PJ/Guru
- Bukti pembayaran PDF
- Audit verifikasi
- Testing database dengan Drizzle
- Testing aplikasi dengan TestSprite

---

# 2. Tujuan

## 2.1 Tujuan Utama

Mengurangi pencatatan manual kegiatan ekstrakurikuler dan menyediakan data absensi serta pembayaran yang mudah dipantau.

## 2.2 Tujuan Khusus

- Memusatkan data ekskul.
- Memudahkan guru/PJ melakukan absensi setiap pertemuan.
- Mencegah absensi siswa tercatat dua kali pada pertemuan yang sama.
- Menyediakan rekap mingguan dan bulanan.
- Memudahkan pencetakan/export laporan.
- Mencatat pembayaran ekskul secara manual.
- Memungkinkan siswa mengunggah bukti pembayaran.
- Memungkinkan Admin dan PJ/Guru melakukan verifikasi pembayaran.
- Membatasi akses PJ hanya pada ekskul yang menjadi tanggung jawabnya.
- Menyediakan riwayat siapa yang melakukan verifikasi pembayaran.

---

# 3. Scope MVP

## Termasuk

- Authentication
- RBAC
- Dashboard berdasarkan role
- CRUD user
- CRUD siswa
- CRUD ekskul
- Penugasan guru/PJ
- CRUD anggota ekskul
- CRUD pertemuan
- Absensi
- Rekap mingguan
- Rekap bulanan
- Export XLSX
- Export PDF
- Pembayaran manual
- Upload bukti pembayaran
- Verifikasi pembayaran
- Penolakan pembayaran
- Bukti pembayaran PDF
- Audit verifikasi
- Testing Drizzle
- Testing API/UI
- Testing TestSprite

## Tidak menjadi prioritas MVP

- Pembayaran online otomatis/payment gateway
- Integrasi WhatsApp otomatis
- QR attendance
- Notifikasi push
- Mobile application native
- Akuntansi sekolah lengkap

Fitur tersebut dapat menjadi fase berikutnya.

---

# 4. Role dan RBAC

## 4.1 Role

```text
ADMIN
PJ_GURU
SISWA
```

### ADMIN

Administrator sekolah yang memiliki akses penuh terhadap data aplikasi.

### PJ_GURU

Guru/Pembina/Penanggung Jawab ekstrakurikuler. PJ hanya dapat mengakses data ekskul yang ditugaskan kepadanya.

### SISWA

Siswa yang terdaftar sebagai anggota ekstrakurikuler.

---

# 5. Matriks Hak Akses

| Fitur | Admin | PJ/Guru | Siswa |
|---|---:|---:|---:|
| Dashboard | ✅ | ✅ | ✅ |
| Kelola User | ✅ | ❌ | ❌ |
| Kelola Data Siswa | ✅ | 👁️ Terbatas | 👁️ Diri sendiri |
| Kelola Ekskul | ✅ | 👁️ Ekskul sendiri | 👁️ |
| Assign PJ | ✅ | ❌ | ❌ |
| Kelola Anggota | ✅ | ✅ Ekskul sendiri | ❌ |
| Buat Pertemuan | ✅ | ✅ Ekskul sendiri | ❌ |
| Edit Pertemuan | ✅ | ✅ Ekskul sendiri | ❌ |
| Hapus Pertemuan | ✅ | ✅ Ekskul sendiri | ❌ |
| Input Absensi | ✅ | ✅ Ekskul sendiri | ❌ |
| Edit Absensi | ✅ | ✅ Ekskul sendiri | ❌ |
| Rekap Mingguan | ✅ | ✅ Ekskul sendiri | 👁️ Diri sendiri |
| Rekap Bulanan | ✅ | ✅ Ekskul sendiri | 👁️ Diri sendiri |
| Export XLSX | ✅ | ✅ Ekskul sendiri | ❌ |
| Export PDF | ✅ | ✅ Ekskul sendiri | ❌ |
| Lihat Pembayaran | ✅ | ✅ Ekskul sendiri | 👁️ Diri sendiri |
| Input Pembayaran Manual | ✅ | ✅ Ekskul sendiri | ❌ |
| Upload Bukti Pembayaran | ❌ | ❌ | ✅ |
| Verifikasi Pembayaran | ✅ | ✅ Ekskul sendiri | ❌ |
| Menolak Pembayaran | ✅ | ✅ Ekskul sendiri | ❌ |
| Cetak Bukti Pembayaran | ✅ | ✅ Ekskul sendiri | ✅ Milik sendiri |
| Lihat Audit Verifikasi | ✅ | 👁️ Ekskul sendiri | ❌ |
| Kelola Guru/PJ | ✅ | ❌ | ❌ |

**Catatan:** PJ/Guru mempunyai hak verifikasi pembayaran, tetapi hanya untuk ekskul yang menjadi tanggung jawabnya.

---

# 6. Prinsip RBAC dan Authorization

RBAC tidak boleh hanya diterapkan pada tampilan frontend.

Semua API/server action wajib melakukan pemeriksaan:

```text
Request
   ↓
Authentication
   ↓
Role Check
   ↓
Resource Ownership Check
   ↓
Permission
```

Untuk PJ/Guru:

```text
current_user
    ↓
role = PJ_GURU
    ↓
cek extracurricular_id
    ↓
apakah guru ditugaskan sebagai PJ?
    ├── YA → izinkan
    └── TIDAK → 403 Forbidden
```

Contoh:

```text
Guru Ahmad → PJ Futsal

Boleh:
- Futsal
- anggota Futsal
- pertemuan Futsal
- absensi Futsal
- pembayaran Futsal
- verifikasi pembayaran Futsal

Tidak boleh:
- Basket
- Pramuka
- Tahfidz
```

---

# 7. Authentication

## Fitur

- Login
- Logout
- Session
- Password hashing
- Protected routes
- Role-based redirect
- Ganti password

## Alur Login

```text
Login
  ↓
Validasi email/username
  ↓
Validasi password
  ↓
Buat session
  ↓
Baca role
  ↓
Redirect dashboard sesuai role
```

## Redirect

```text
ADMIN     → /admin/dashboard
PJ_GURU   → /pj/dashboard
SISWA     → /siswa/dashboard
```

---

# 8. Dashboard

## 8.1 Admin

Menampilkan:

- Total ekskul
- Total guru/PJ
- Total siswa
- Total anggota ekskul
- Pertemuan bulan berjalan
- Persentase kehadiran
- Pembayaran menunggu verifikasi
- Pembayaran lunas
- Grafik kehadiran
- Grafik pembayaran

---

## 8.2 PJ/Guru

Menampilkan:

- Ekskul yang diampu
- Jumlah anggota
- Pertemuan minggu ini
- Absensi terakhir
- Persentase kehadiran
- Pembayaran menunggu verifikasi
- Pembayaran bulan berjalan

---

## 8.3 Siswa

Menampilkan:

- Ekskul yang diikuti
- Jadwal pertemuan
- Riwayat absensi
- Persentase kehadiran
- Status pembayaran
- Riwayat pembayaran
- Bukti pembayaran

---

# 9. Master Data User

Admin dapat melakukan CRUD user.

Data:

```text
id
nama
email
password
role
status
created_at
updated_at
```

Role:

```text
ADMIN
PJ_GURU
SISWA
```

Password tidak boleh disimpan dalam bentuk plaintext.

---

# 10. Master Data Siswa

Admin dapat melakukan CRUD:

```text
NIS
NISN
Nama
Jenis Kelamin
Kelas
Email
Nomor HP
Status
User ID
```

Status:

```text
AKTIF
NONAKTIF
LULUS
```

---

# 11. Master Data Ekstrakurikuler

Admin dapat melakukan:

- Create
- Read
- Update
- Delete

Data:

```text
id
kode
nama
deskripsi
hari
jam_mulai
jam_selesai
tempat
biaya_bulanan
status
created_at
updated_at
```

Contoh:

```text
Kode       : EKS001
Nama       : Futsal
Hari       : Jumat
Jam        : 15:30 - 17:00
Tempat     : Lapangan Sekolah
Biaya      : Rp50.000
Status     : Aktif
```

---

# 12. Penugasan PJ/Guru

Admin menentukan guru sebagai PJ untuk setiap ekskul.

Tabel:

```text
extracurricular_staff
```

Data:

```text
id
extracurricular_id
user_id
created_at
```

Satu guru dapat menjadi PJ lebih dari satu ekskul.

Satu ekskul dapat memiliki satu atau lebih guru/PJ sesuai kebijakan sekolah.

---

# 13. Keanggotaan Ekskul

Relasi:

```text
Siswa
   ↓
Membership
   ↓
Ekstrakurikuler
```

Data:

```text
id
student_id
extracurricular_id
joined_at
status
created_at
updated_at
```

Status:

```text
AKTIF
NONAKTIF
KELUAR
```

Constraint:

```text
UNIQUE(student_id, extracurricular_id)
```

Tujuannya agar satu siswa tidak terdaftar dua kali pada ekskul yang sama.

---

# 14. Pertemuan Ekskul

PJ/Guru dapat membuat pertemuan mingguan.

Data:

```text
id
extracurricular_id
meeting_date
start_time
end_time
topic
location
status
notes
created_at
updated_at
```

Status:

```text
DIJADWALKAN
BERLANGSUNG
SELESAI
DIBATALKAN
```

Contoh:

```text
Ekskul   : Futsal
Tanggal  : 04 September 2026
Jam      : 15:30 - 17:00
Materi   : Passing dan Shooting
Tempat   : Lapangan Utama
```

---

# 15. Modul Absensi

Absensi adalah fitur utama aplikasi.

Setiap pertemuan menghasilkan data absensi untuk seluruh anggota aktif.

Status:

```text
H = Hadir
I = Izin
S = Sakit
A = Alpa
```

Opsional:

```text
T = Terlambat
```

---

# 16. Input Absensi

Tampilan:

```text
PERTEMUAN
Futsal
Jumat, 4 September 2026

--------------------------------
No | Nama       | Status
--------------------------------
1  | Ahmad      | H
2  | Budi       | I
3  | Candra     | H
4  | Deni       | A
5  | Eko        | S
--------------------------------

[ HADIR SEMUA ]
[ SIMPAN ABSENSI ]
```

Fitur:

- Hadir semua
- Pilih status per siswa
- Catatan
- Simpan massal
- Edit absensi

---

# 17. Anti-Duplikasi Absensi

Database wajib memiliki constraint:

```text
UNIQUE(meeting_id, student_id)
```

Satu siswa hanya boleh mempunyai satu record absensi pada satu pertemuan.

Jika terjadi duplikasi:

```text
Absensi siswa sudah tersedia.
Silakan edit data absensi.
```

Operasi penyimpanan absensi massal sebaiknya menggunakan transaction.

```text
BEGIN
   insert attendance
   insert attendance
   insert attendance
COMMIT
```

Jika salah satu gagal:

```text
ROLLBACK
```

---

# 18. Rekap Absensi Mingguan

Filter:

```text
Ekskul
Tanggal mulai
Tanggal akhir
```

Contoh:

| Siswa | H | I | S | A | Total | % |
|---|---:|---:|---:|---:|---:|---:|
| Ahmad | 1 | 0 | 0 | 0 | 1 | 100% |
| Budi | 0 | 1 | 0 | 0 | 1 | 0% |
| Candra | 1 | 0 | 0 | 0 | 1 | 100% |

---

# 19. Rekap Absensi Bulanan

Filter:

```text
Ekskul
Bulan
Tahun
```

Contoh:

| Siswa | H | I | S | A | Total Pertemuan | Kehadiran |
|---|---:|---:|---:|---:|---:|---:|
| Ahmad | 4 | 0 | 0 | 0 | 4 | 100% |
| Budi | 3 | 0 | 1 | 0 | 4 | 75% |
| Candra | 2 | 0 | 0 | 2 | 4 | 50% |

Rumus:

```text
Persentase Kehadiran =
Jumlah Hadir / Total Pertemuan × 100
```

---

# 20. Export Absensi XLSX

Admin dan PJ/Guru dapat melakukan export.

Kolom:

```text
No
NIS
Nama
Kelas
Hadir
Izin
Sakit
Alpa
Total Pertemuan
Persentase Kehadiran
```

Nama file:

```text
rekap-absensi-futsal-september-2026.xlsx
```

PJ hanya dapat melakukan export data ekskul yang menjadi tanggung jawabnya.

---

# 21. Export Absensi PDF

PDF memuat:

```text
SMPIT DARUL MUTTAQIEN
REKAP ABSENSI EKSTRAKURIKULER

Ekskul
Periode
PJ/Guru

No
NIS
Nama
Kelas
H
I
S
A
Total
%

Jumlah Pertemuan
Persentase Kehadiran
Tanggal Cetak
```

---

# 22. Modul Pembayaran Manual

Pembayaran dapat dicatat oleh Admin atau PJ/Guru untuk ekskul yang menjadi tanggung jawabnya.

Metode pembayaran dapat berupa:

```text
TUNAI
TRANSFER
LAINNYA
```

Data:

```text
id
student_id
extracurricular_id
period
payment_date
amount
payment_method
reference_number
proof_file
status
verification_note
verified_by
verified_at
created_by
created_at
updated_at
```

Status:

```text
MENUNGGU_VERIFIKASI
LUNAS
DITOLAK
```

---

# 23. Alur Pembayaran

```text
Siswa melakukan pembayaran
        ↓
Bukti pembayaran
        ↓
Siswa upload bukti
        ↓
STATUS:
MENUNGGU_VERIFIKASI
        ↓
┌─────────────────────┐
│ Admin / PJ Guru     │
│ melakukan verifikasi│
└─────────┬───────────┘
          ↓
    ┌─────┴─────┐
    ↓           ↓
  LUNAS       DITOLAK
    │           │
    ↓           ↓
Bukti PDF    Catatan alasan
```

---

# 24. Verifikasi Pembayaran oleh PJ/Guru

Ini merupakan aturan penting sistem.

PJ/Guru **berhak melakukan verifikasi pembayaran** untuk siswa pada ekskul yang menjadi tanggung jawabnya.

Contoh:

```text
Guru Ahmad
PJ Futsal
```

Maka Guru Ahmad dapat:

```text
Melihat pembayaran Futsal
Verifikasi pembayaran Futsal
Menolak pembayaran Futsal
Melihat bukti pembayaran Futsal
Mencetak bukti pembayaran Futsal
```

Tetapi tidak dapat memverifikasi:

```text
Basket
Pramuka
Tahfidz
PMR
```

---

# 25. Verifikasi Pembayaran

Form:

```text
Data Pembayaran

Siswa       : Ahmad Fauzan
NIS         : 20260123
Kelas       : VIII-2
Ekskul      : Futsal
Periode     : September 2026
Nominal     : Rp50.000
Tanggal     : 01 September 2026
Metode      : Transfer

Bukti       : bukti-transfer.jpg

Status      : MENUNGGU VERIFIKASI

[ VERIFIKASI / TERIMA ]
[ TOLAK ]
```

Jika diterima:

```text
status = LUNAS
verified_by = user_id PJ/Admin
verified_at = timestamp
```

Jika ditolak:

```text
status = DITOLAK
verification_note = alasan
verified_by = user_id PJ/Admin
verified_at = timestamp
```

---

# 26. Audit Verifikasi

Setiap verifikasi wajib menyimpan:

```text
verified_by
verified_at
verification_note
```

Contoh:

```text
Pembayaran
TRX-2026090001

Status:
LUNAS

Diverifikasi oleh:
Ahmad Fauzi, S.Pd.

Role:
PJ/Guru Ekskul

Tanggal:
02 September 2026 15:42

Catatan:
Pembayaran telah diterima.
```

Admin dapat melihat seluruh audit.

PJ hanya dapat melihat audit ekskul yang menjadi tanggung jawabnya.

---

# 27. Upload Bukti Pembayaran

Siswa dapat mengupload bukti pembayaran.

Format:

```text
JPG
JPEG
PNG
PDF
```

Ukuran maksimum:

```text
5 MB
```

Validasi:

- MIME type
- ukuran file
- nama file aman
- akses file tidak boleh publik secara tidak terkendali

Untuk MVP, storage dapat menggunakan storage gratis dari provider yang dipilih atau object storage yang kompatibel.

---

# 28. Bukti Pembayaran PDF

Setelah status menjadi LUNAS, sistem dapat menghasilkan bukti pembayaran.

Format:

```text
========================================
       SMPIT DARUL MUTTAQIEN
         BUKTI PEMBAYARAN
        EKSTRAKURIKULER
========================================

No Transaksi : TRX-2026090001

Nama Siswa   : Ahmad Fauzan
NIS          : 20260123
Kelas        : VIII-2

Ekskul       : Futsal
Periode      : September 2026

Tanggal      : 01 September 2026
Nominal      : Rp50.000
Metode       : Transfer
Status       : LUNAS

Diverifikasi:
Ahmad Fauzi, S.Pd.
PJ/Guru Ekskul

Tanggal Verifikasi:
02 September 2026

========================================
```

---

# 29. Riwayat Pembayaran

Admin:

```text
Filter:
- Ekskul
- Siswa
- Periode
- Bulan
- Status
```

PJ:

```text
Hanya ekskul yang diampu
```

Siswa:

```text
Hanya pembayaran miliknya
```

---

# 30. Database

## Rekomendasi

**Neon PostgreSQL**

Alasan:

- PostgreSQL
- Cocok untuk aplikasi web modern
- Serverless
- Tersedia Free Plan
- Cocok dengan Next.js
- Cocok dengan Drizzle ORM

Referensi:

- Neon: https://neon.com/
- Drizzle + Neon: https://orm.drizzle.team/docs/get-started/neon-existing

Alternatif:

- Supabase PostgreSQL
- PostgreSQL self-hosted

Untuk MVP:

```text
Next.js
+
Drizzle ORM
+
Neon PostgreSQL
```

---

# 31. ORM

Gunakan:

```text
Drizzle ORM
Drizzle Kit
```

Drizzle digunakan untuk:

- Schema
- Query
- Relation
- Migration
- Database testing
- Type-safe database access

Referensi:

https://orm.drizzle.team/docs/get-started/postgresql-new

---

# 32. Struktur Database

## users

```text
id
name
email
password_hash
role
is_active
created_at
updated_at
```

## students

```text
id
user_id
nis
nisn
name
gender
class_name
phone
status
created_at
updated_at
```

## extracurriculars

```text
id
code
name
description
day
start_time
end_time
location
monthly_fee
status
created_at
updated_at
```

## extracurricular_staff

```text
id
extracurricular_id
user_id
created_at
```

Constraint:

```text
UNIQUE(extracurricular_id, user_id)
```

## memberships

```text
id
student_id
extracurricular_id
joined_at
status
created_at
updated_at
```

Constraint:

```text
UNIQUE(student_id, extracurricular_id)
```

## meetings

```text
id
extracurricular_id
meeting_date
start_time
end_time
topic
location
status
notes
created_at
updated_at
```

## attendance

```text
id
meeting_id
student_id
status
notes
recorded_by
created_at
updated_at
```

Constraint:

```text
UNIQUE(meeting_id, student_id)
```

## payments

```text
id
student_id
extracurricular_id
period
payment_date
amount
payment_method
reference_number
proof_file
status
verification_note
verified_by
verified_at
created_by
created_at
updated_at
```

## payment_receipts

```text
id
payment_id
receipt_number
file_url
generated_at
```

---

# 33. ERD

```text
USERS
  │
  ├────────────── STUDENTS
  │                    │
  │                    ▼
  │              MEMBERSHIPS
  │                    │
  │                    ▼
  │             EXTRACURRICULARS
  │                    │
  │              ┌─────┴─────┐
  │              ▼           ▼
  │          MEETINGS      STAFF/PJ
  │              │
  │              ▼
  │          ATTENDANCE
  │
  └── PJ/GURU

STUDENTS
   │
   ▼
PAYMENTS
   │
   ▼
PAYMENT_RECEIPTS
```

Relasi pembayaran:

```text
STUDENT
   ↓
PAYMENT
   ↓
EXTRACURRICULAR
   ↓
VERIFIED_BY USER
```

---

# 34. Tech Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
```

## Backend

```text
Next.js Route Handlers
Server Actions
```

## Database

```text
PostgreSQL
Neon
```

## ORM

```text
Drizzle ORM
Drizzle Kit
```

## Validation

```text
Zod
```

## Export

```text
ExcelJS
PDF library
```

## Testing

```text
Vitest
Playwright
TestSprite
Drizzle test
```

## Deployment

```text
Vercel
+
Neon PostgreSQL
```

---

# 35. Struktur Folder

```text
sim-ekskul/
│
├── app/
│   ├── login/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── students/
│   │   ├── extracurriculars/
│   │   ├── memberships/
│   │   ├── payments/
│   │   └── reports/
│   │
│   ├── pj/
│   │   ├── dashboard/
│   │   ├── meetings/
│   │   ├── attendance/
│   │   ├── payments/
│   │   └── reports/
│   │
│   ├── siswa/
│   │   ├── dashboard/
│   │   ├── attendance/
│   │   ├── payments/
│   │   └── receipts/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   └── dashboard/
│
├── lib/
│   ├── auth/
│   ├── rbac/
│   ├── permissions/
│   ├── validation/
│   ├── pdf/
│   └── excel/
│
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── seed.ts
│
├── drizzle/
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── testsprite/
│   ├── auth/
│   ├── rbac/
│   ├── attendance/
│   ├── payment/
│   └── reports/
│
├── drizzle.config.ts
├── package.json
└── .env
```

---

# 36. API

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Users

```http
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

## Students

```http
GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
```

## Extracurriculars

```http
GET    /api/extracurriculars
POST   /api/extracurriculars
GET    /api/extracurriculars/:id
PUT    /api/extracurriculars/:id
DELETE /api/extracurriculars/:id
```

## Memberships

```http
GET    /api/memberships
POST   /api/memberships
PUT    /api/memberships/:id
DELETE /api/memberships/:id
```

## Meetings

```http
GET    /api/meetings
POST   /api/meetings
GET    /api/meetings/:id
PUT    /api/meetings/:id
DELETE /api/meetings/:id
```

## Attendance

```http
GET  /api/attendance
POST /api/attendance
PUT  /api/attendance/:id
```

## Reports

```http
GET /api/reports/attendance/weekly
GET /api/reports/attendance/monthly
```

## Payments

```http
GET  /api/payments
POST /api/payments
GET  /api/payments/:id
PUT  /api/payments/:id
```

## Payment verification

```http
POST /api/payments/:id/verify
POST /api/payments/:id/reject
```

Endpoint wajib melakukan ownership check untuk PJ/Guru.

## Export

```http
GET /api/export/attendance/xlsx
GET /api/export/attendance/pdf
GET /api/export/payment/pdf
```

---

# 37. Aturan Bisnis Absensi

1. Hanya anggota aktif yang dapat diabsen.
2. Satu siswa hanya memiliki satu absensi pada satu pertemuan.
3. PJ hanya dapat mengabsen ekskul yang menjadi tanggung jawabnya.
4. Admin dapat mengakses semua ekskul.
5. Siswa hanya dapat melihat absensinya sendiri.
6. Absensi yang telah disimpan tetap dapat diedit oleh Admin/PJ sesuai hak akses.
7. Penghapusan pertemuan harus memperhatikan data absensi terkait.
8. Penghapusan data yang memiliki histori penting sebaiknya menggunakan soft delete/status nonaktif.

---

# 38. Aturan Bisnis Pembayaran

1. Pembayaran dibuat berdasarkan siswa + ekskul + periode.
2. Pembayaran baru memiliki status `MENUNGGU_VERIFIKASI`.
3. Admin dapat memverifikasi semua pembayaran.
4. PJ/Guru dapat memverifikasi pembayaran hanya untuk ekskul yang menjadi tanggung jawabnya.
5. PJ/Guru tidak boleh memverifikasi pembayaran ekskul lain.
6. Siswa hanya dapat melihat pembayaran miliknya.
7. Bukti pembayaran dapat dilihat oleh Admin, PJ terkait, dan siswa pemilik pembayaran.
8. Pembayaran yang ditolak wajib memiliki alasan/catatan.
9. Pembayaran yang telah `LUNAS` dapat menghasilkan bukti pembayaran PDF.
10. Setiap verifikasi menyimpan `verified_by` dan `verified_at`.
11. Sistem harus mencatat siapa yang membuat transaksi melalui `created_by`.
12. Nomor transaksi harus unik.

---

# 39. Testing Database dengan Drizzle

## Test DB-001 — Connection

```text
SELECT 1
```

Expected:

```text
Database connection berhasil.
```

## Test DB-002 — CRUD

Uji:

```text
Create
Read
Update
Delete
```

untuk:

- users
- students
- extracurriculars
- memberships
- meetings
- attendance
- payments

## Test DB-003 — Unique Membership

Input:

```text
student_id = 1
extracurricular_id = 1
```

dua kali.

Expected:

```text
Database menolak data duplikat.
```

## Test DB-004 — Unique Attendance

Input dua record:

```text
meeting_id = 1
student_id = 1
```

Expected:

```text
UNIQUE constraint error
```

## Test DB-005 — Payment Transaction

Pastikan pembayaran dan data terkait tersimpan secara konsisten.

## Test DB-006 — Verification Audit

Setelah verifikasi:

```text
status = LUNAS
verified_by != null
verified_at != null
```

---

# 40. Testing Unit

Gunakan Vitest.

Test:

```text
calculateAttendancePercentage()
validatePayment()
checkPermission()
checkPJOwnership()
generateReceiptNumber()
```

Contoh:

```text
Hadir = 4
Total = 5

Expected:
80%
```

---

# 41. Testing API

Pengujian harus mencakup:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

# 42. Test RBAC

## TC-RBAC-001

Admin login.

Expected:

```text
Admin dashboard tampil.
```

## TC-RBAC-002

PJ login.

Expected:

```text
Dashboard PJ tampil.
```

## TC-RBAC-003

Siswa login.

Expected:

```text
Dashboard siswa tampil.
```

## TC-RBAC-004

PJ membuka `/admin/users`.

Expected:

```text
403 Forbidden
```

## TC-RBAC-005

Siswa membuka `/admin`.

Expected:

```text
403 Forbidden
```

## TC-RBAC-006

PJ Futsal mencoba membuka data Basket.

Expected:

```text
403 Forbidden
```

---

# 43. Test Verifikasi Pembayaran

## TC-PAY-001

PJ Futsal membuka pembayaran Futsal.

Expected:

```text
200 OK
```

## TC-PAY-002

PJ Futsal melakukan verifikasi pembayaran Futsal.

Expected:

```text
status = LUNAS
verified_by = PJ
verified_at = timestamp
```

## TC-PAY-003

PJ Futsal mencoba verifikasi pembayaran Basket.

Expected:

```text
403 Forbidden
```

## TC-PAY-004

Admin melakukan verifikasi pembayaran Basket.

Expected:

```text
status = LUNAS
```

## TC-PAY-005

PJ menolak pembayaran.

Expected:

```text
status = DITOLAK
verification_note wajib diisi
```

---

# 44. Test Absensi

## TC-ATT-001

PJ membuat pertemuan.

Expected:

```text
Meeting berhasil dibuat.
```

## TC-ATT-002

PJ mengisi absensi.

Expected:

```text
Attendance tersimpan.
```

## TC-ATT-003

PJ mengisi absensi dua kali untuk siswa yang sama.

Expected:

```text
409 Conflict
```

atau sistem mengubah data existing tanpa membuat record baru.

## TC-ATT-004

Admin mengedit absensi.

Expected:

```text
Berhasil.
```

## TC-ATT-005

Siswa mencoba mengubah absensi.

Expected:

```text
403 Forbidden
```

---

# 45. Test Rekap

## TC-REPORT-001

Pilih ekskul dan periode mingguan.

Expected:

```text
Rekap mingguan tampil.
```

## TC-REPORT-002

Pilih bulan.

Expected:

```text
Rekap bulanan tampil.
```

## TC-REPORT-003

Export XLSX.

Expected:

```text
File XLSX berhasil dibuat.
```

## TC-REPORT-004

Export PDF.

Expected:

```text
File PDF berhasil dibuat.
```

---

# 46. Test Bukti Pembayaran

## TC-RECEIPT-001

Pembayaran status `LUNAS`.

Klik:

```text
Cetak Bukti
```

Expected:

```text
PDF berhasil dibuat.
```

## TC-RECEIPT-002

Pembayaran status `MENUNGGU_VERIFIKASI`.

Expected:

```text
Bukti pembayaran resmi belum dapat diterbitkan.
```

## TC-RECEIPT-003

Pembayaran status `DITOLAK`.

Expected:

```text
Bukti LUNAS tidak dapat diterbitkan.
```

---

# 47. TestSprite

TestSprite digunakan untuk testing aplikasi secara end-to-end berdasarkan PRD.

Dokumentasi:

https://docs.testsprite.com/

PRD ini menjadi dasar test plan.

## Area TestSprite

```text
Authentication
RBAC
CRUD
Meeting
Attendance
Weekly Report
Monthly Report
Payment
Payment Verification
Receipt PDF
Export XLSX
Export PDF
Security
```

---

# 48. TestSprite Scenario

## Authentication

```text
Login Admin berhasil
Login PJ berhasil
Login Siswa berhasil
Password salah
Logout
Session expired
Protected route
```

## RBAC

```text
Admin → semua fitur
PJ → ekskul sendiri
PJ → ekskul lain harus ditolak
Siswa → data sendiri
Siswa → admin harus ditolak
```

## Attendance

```text
Buat meeting
Input attendance
Edit attendance
Duplicate attendance
Rekap mingguan
Rekap bulanan
Export XLSX
Export PDF
```

## Payment

```text
Buat payment
Upload proof
Lihat payment
Verify payment
Reject payment
Audit verification
Generate receipt
```

---

# 49. Security Testing

Wajib melakukan pengujian:

```text
Authentication bypass
Authorization bypass
IDOR
Privilege escalation
SQL injection
XSS
CSRF sesuai arsitektur
Invalid input
File upload abuse
Unauthorized file access
Session manipulation
```

Contoh IDOR:

```text
PJ Futsal

GET /api/payments/BASKET_PAYMENT_ID

Expected:
403 Forbidden
```

Bukan:

```text
200 OK
```

---

# 50. Validasi Upload

File bukti pembayaran:

```text
Allowed:
image/jpeg
image/png
application/pdf
```

Maksimal:

```text
5 MB
```

Sistem harus:

- Memvalidasi MIME type.
- Membatasi ukuran.
- Menghindari executable upload.
- Menghasilkan nama file aman.
- Tidak mempercayai nama file dari user.
- Membatasi akses file sesuai ownership.

---

# 51. Non-Functional Requirements

## Performance

Target:

```text
Dashboard < 3 detik
Rekap < 3 detik untuk data normal
Export < 10 detik untuk laporan normal
```

## Responsive

Wajib mendukung:

```text
Desktop
Laptop
Tablet
Mobile
```

## Security

- Password hashing
- Session secure
- Server-side authorization
- Input validation
- Database constraints
- Audit verification
- Secure file handling

## Availability

MVP menggunakan layanan cloud dengan free tier.

---

# 52. Seed Data Development

Database development harus mempunyai seed:

## Admin

```text
admin@example.com
role: ADMIN
```

## Guru/PJ

```text
guru1@example.com
role: PJ_GURU

guru2@example.com
role: PJ_GURU
```

## Siswa

```text
siswa1@example.com
role: SISWA

siswa2@example.com
role: SISWA
```

## Ekskul

```text
Futsal
Basket
Pramuka
Tahfidz
```

## Contoh

```text
Guru 1 → Futsal
Guru 2 → Basket
```

Seed harus hanya digunakan untuk development/testing dan password demo tidak digunakan pada production.

---

# 53. Acceptance Criteria MVP

## Authentication

- [ ] Admin dapat login.
- [ ] PJ/Guru dapat login.
- [ ] Siswa dapat login.
- [ ] Logout berfungsi.
- [ ] Protected routes berfungsi.

## RBAC

- [ ] Admin dapat mengakses semua data.
- [ ] PJ hanya dapat mengakses ekskul yang ditugaskan.
- [ ] PJ dapat memverifikasi pembayaran ekskul sendiri.
- [ ] PJ tidak dapat memverifikasi pembayaran ekskul lain.
- [ ] Siswa hanya dapat melihat data miliknya.

## Ekskul

- [ ] Admin dapat CRUD ekskul.
- [ ] Admin dapat assign PJ.
- [ ] Anggota dapat dikelola.

## Absensi

- [ ] PJ dapat membuat pertemuan.
- [ ] PJ dapat mengisi absensi.
- [ ] Absensi tidak dapat duplikat.
- [ ] Rekap mingguan tersedia.
- [ ] Rekap bulanan tersedia.
- [ ] XLSX tersedia.
- [ ] PDF tersedia.

## Pembayaran

- [ ] Pembayaran manual dapat dicatat.
- [ ] Bukti pembayaran dapat diupload.
- [ ] Status menunggu tersedia.
- [ ] Admin dapat memverifikasi.
- [ ] PJ dapat memverifikasi ekskul sendiri.
- [ ] PJ tidak dapat memverifikasi ekskul lain.
- [ ] Pembayaran dapat ditolak dengan alasan.
- [ ] Audit verifikasi tersimpan.
- [ ] Bukti pembayaran PDF dapat dibuat setelah LUNAS.

## Testing

- [ ] Drizzle database test pass.
- [ ] Unit test pass.
- [ ] API test pass.
- [ ] E2E test pass.
- [ ] TestSprite test pass.
- [ ] RBAC test pass.
- [ ] Security test pass.

---

# 54. Prioritas Development

## Phase 1 — Foundation

```text
Project setup
↓
Next.js
↓
Database Neon
↓
Drizzle
↓
Authentication
↓
RBAC
```

## Phase 2 — Master Data

```text
Users
↓
Students
↓
Extracurriculars
↓
PJ/Guru
↓
Memberships
```

## Phase 3 — Absensi

```text
Meetings
↓
Attendance
↓
Anti-duplicate
↓
Weekly Report
↓
Monthly Report
```

## Phase 4 — Export

```text
XLSX
PDF
```

## Phase 5 — Payment

```text
Payment
↓
Upload Proof
↓
Verification
↓
Audit
↓
Receipt PDF
```

## Phase 6 — Testing

```text
Drizzle Test
↓
Vitest
↓
API Test
↓
Playwright
↓
TestSprite
↓
Security Test
```

---

# 55. Definition of Done

MVP dinyatakan selesai jika:

1. Semua role dapat login.
2. RBAC bekerja di frontend dan backend.
3. PJ/Guru dapat mengelola ekskul yang menjadi tanggung jawabnya.
4. PJ/Guru dapat membuat pertemuan.
5. PJ/Guru dapat melakukan absensi.
6. Sistem mencegah duplikasi absensi.
7. Rekap mingguan tersedia.
8. Rekap bulanan tersedia.
9. Export XLSX tersedia.
10. Export PDF tersedia.
11. Pembayaran manual tersedia.
12. Bukti pembayaran dapat diupload.
13. Admin dapat memverifikasi pembayaran.
14. PJ/Guru dapat memverifikasi pembayaran ekskulnya.
15. PJ/Guru tidak dapat memverifikasi pembayaran ekskul lain.
16. Pembayaran ditolak harus mempunyai catatan.
17. Audit verifikasi tersimpan.
18. Bukti pembayaran PDF dapat dicetak setelah status LUNAS.
19. Drizzle database tests pass.
20. TestSprite tests pass.
21. Tidak ditemukan celah authorization kritis pada pengujian MVP.

---

# 56. Referensi Teknologi

## Neon PostgreSQL

https://neon.com/

## Drizzle ORM

https://orm.drizzle.team/

## Drizzle PostgreSQL

https://orm.drizzle.team/docs/get-started/postgresql-new

## Drizzle + Neon

https://orm.drizzle.team/docs/get-started/neon-existing

## TestSprite

https://docs.testsprite.com/

---

# 57. Kesimpulan

SIM-EKSKUL dirancang sebagai aplikasi web sederhana dengan fokus pada dua kebutuhan operasional utama:

```text
KEGIATAN
   ↓
PERTEMUAN
   ↓
ABSENSI
   ↓
REKAP
   ↓
LAPORAN
```

dan:

```text
PEMBAYARAN
   ↓
BUKTI
   ↓
VERIFIKASI ADMIN / PJ GURU
   ↓
LUNAS / DITOLAK
   ↓
BUKTI PEMBAYARAN PDF
```

Kunci keamanan sistem adalah:

```text
ADMIN
  ↓
Full Access

PJ/GURU
  ↓
Access berdasarkan ekskul yang ditugaskan

SISWA
  ↓
Access berdasarkan data miliknya
```

Dengan desain ini, **PJ/Guru bukan sekadar operator absensi**, tetapi menjadi penanggung jawab ekskul yang memiliki kewenangan operasional, termasuk **verifikasi pembayaran siswa pada ekskulnya sendiri**, sementara Admin tetap memiliki akses penuh untuk supervisi dan audit.
