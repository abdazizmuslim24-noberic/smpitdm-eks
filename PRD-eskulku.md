# PRD — SIM-EKSKUL
## Sistem Manajemen Ekstrakurikuler Sekolah Berbasis Web

**Versi:** 1.1  
**Tanggal:** 3 September 2026  
**Status:** Draft siap development  
**Platform:** Web Responsive  
**Fokus MVP:** Absensi pertemuan mingguan, rekap, pembayaran manual, verifikasi pembayaran, dan laporan.

---

> **⚠️ CRITICAL SYNC RULE — WAJIB DIBACA**
>
> **`db/schema.ts` adalah single source of truth untuk semua struktur database.**
>
> Sebelum membuat migrasi, menambah kolom, atau mengubah schema:
> 1. Selalu baca `db/schema.ts` terlebih dahulu.
> 2. Jangan pernah mengandalkan isi PRD ini saja — PRD bisa tertinggal dari kode.
> 3. Setelah mengubah schema, **wajib update PRD ini** agar tidak ada mismatch.
> 4. Kolom yang sudah dihapus dari schema (contoh: `nisn` pada `students`) **TIDAK BOLEH** ditambahkan kembali tanpa diskusi.
> 5. Migration file harus di-generate dari `schema.ts`, bukan ditulis manual.

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

Guru/Pembina/Penanggung Jawab ekstrakurikuler. PJ hanya dapat mengakses data ekskul yang ditugaskan kepadanya, termasuk pengaturan info rekening/QR untuk ekskulnya.

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
| Atur Bank/QR Ekskul | ✅ | ✅ Ekskul sendiri | ❌ |
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
| Lihat Info Bank/QR Ekskul | ✅ | ✅ Ekskul sendiri | ✅ Ekskul diikuti |
| Download QR Ekskul | ✅ | ✅ Ekskul sendiri | ✅ Ekskul diikuti |
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
NIS          ← UNIQUE, wajib
Nama
Jenis Kelamin
Kelas
Phone
Status
User ID      ← FK ke users.id, nullable
```

> **CATATAN:** Kolom `NISN` tidak ada dalam database — sengaja dihapus saat simplifikasi schema. Jangan tambahkan.

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
code                  ← UNIQUE, wajib (contoh: EKS001)
name
description
day
start_time
end_time
location
monthly_fee
bank_name             ← nullable: nama bank untuk pembayaran ekskul ini
bank_account_number   ← nullable: nomor rekening
bank_account_holder   ← nullable: nama pemilik rekening
qr_code_url           ← nullable: URL file QR code (JPG/PNG, maks 5MB)
status
created_at
updated_at
```

> **CATATAN:** Kolom `bank_*` dan `qr_code_url` bersifat **per-ekskul** — setiap ekskul bisa punya info rekening/QR yang berbeda. QR bersifat opsional; jika tidak ada, tampilkan hanya nomor rekening.

Contoh:

```text
Kode       : EKS001
Nama       : Futsal
Hari       : Jumat
Jam        : 15:30 - 17:00
Tempat     : Lapangan Sekolah
Biaya      : Rp50.000
Bank       : BCA
No Rek     : 7005936063
A.N.       : ABDUL AZIZ MUSLIM
QR Code    : qr-bca.jpeg
Status     : Aktif
```

### Pengaturan Bank/QR oleh Admin

Admin mengatur info rekening/QR melalui form ekstrakurikuler:

- Field teks: Nama Bank, No. Rekening, A.N. Pemilik
- Field file: Upload QR Code (JPG/PNG, maks 5MB, validasi MIME server-side)
- Preview QR saat edit; tombol "Hapus QR" untuk menghapus file + set kolom DB ke NULL
- **Penyimpanan file: base64 data URI langsung di kolom PostgreSQL** (`qr_code_url` = `data:<mime>;base64,...`) — GRATIS, tanpa filesystem/Vercel Blob/R2/Supabase (tidak bisa di Vercel serverless read-only)

### Pengaturan Bank/QR oleh PJ/Guru

PJ dapat mengedit info rekening/QR untuk ekskul yang menjadi tanggung jawabnya:

- Route: `/pj/ekskuls` — halaman Pengaturan Ekskul (server component)
- Tabel daftar ekskul PJ + info bank/QR saat ini + tombol "Edit Rekening"
- Dialog edit (`ekskul-payment-dialog.tsx`): field bank + upload QR
- API: `PUT /api/pj/ekskuls` — RBAC check, FormData, validasi MIME
- PJ **tidak boleh** mengedit ekskul yang bukan miliknya

### Tampilan Info Pembayaran untuk Siswa

Info rekening/QR per ekskul ditampilkan kepada siswa di:

- Halaman `/siswa/payments`: panel "Petunjuk Pembayaran" — kartu per ekskul (bank, no rek, a.n., QR + download)
- Dialog "Bayar Iuran": saat pilih ekskul, tampilkan info bank/QR ekskul terpilih secara live
- API `/api/siswa/my-ekskuls`: mengembalikan `bankName`, `bankAccountNumber`, `bankAccountHolder`, `qrCodeUrl`

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
Siswa membuka halaman Pembayaran
         ↓
Info Bank/QR per Ekskul ditampilkan
(Kartu per ekskul: bank, no rek, a.n., QR)
         ↓
Siswa klik "Bayar Iuran" → pilih Ekskul
         ↓
Info Bank/QR Ekskul terpilih ditampilkan di dialog
         ↓
Siswa isi form + upload bukti
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
(dengan info bank/QR)
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
Mengatur info bank/QR Futsal
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
- akses file tidak boleh publik secara tidak terkendali

**Penyimpanan (GRATIS, serverless-friendly):** file di-encode sebagai **base64 data URI** dan disimpan langsung di kolom PostgreSQL (`data:<mime>;base64,...`). Tanpa filesystem, tanpa object storage (Vercel Blob/R2/Supabase = berbayar / tidak gratis). Karena disimpan di DB, ukuran file dibatasi maks 5MB agar tidak membebani kolom text.

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

Dibayar Melalui:
Bank         : BCA
No. Rekening : 7005936063
A.N.         : ABDUL AZIZ MUSLIM

Diverifikasi:
Ahmad Fauzi, S.Pd.
PJ/Guru Ekskul

Tanggal Verifikasi:
02 September 2026

========================================
```

> Catatan: Bagian "Dibayar Melalui" hanya ditampilkan jika info bank tersedia di ekskul terkait. QR code tidak dicetak di PDF.

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

> **CRITICAL:** Source of truth = `db/schema.ts`. Selalu cross-check sebelum migrasi.

## users

```text
id
name
email               ← UNIQUE
password_hash
role                ← ADMIN | PJ_GURU | SISWA (default SISWA)
is_active           ← integer, default 1
created_at
updated_at
```

## students

```text
id
user_id             ← FK → users.id (set null on delete), nullable
nis                 ← UNIQUE, NOT NULL
name
gender
class_name
phone
status              ← AKTIF | NONAKTIF | LULUS (default AKTIF)
created_at
updated_at
```

> **TIDAK ADA KOLUM `nisn`.** Jangan tambahkan — sudah dihapus saat simplifikasi. Students = 10 kolom.

## extracurriculars

```text
id
code                ← UNIQUE, NOT NULL
name
description
day
start_time
end_time
location
monthly_fee         ← double, default 0
bank_name           ← nullable: nama bank pembayaran per-ekskul
bank_account_number ← nullable: nomor rekening
bank_account_holder ← nullable: nama pemilik rekening
qr_code_url         ← nullable: path/URL file QR code image
status              ← AKTIF | NONAKTIF (default AKTIF)
created_at
updated_at
```

## extracurricular_staff

```text
id
extracurricular_id  ← FK → extracurriculars.id (cascade)
user_id             ← FK → users.id (cascade)
created_at
```

Constraint:

```text
UNIQUE(extracurricular_id, user_id)
```

## memberships

```text
id
student_id          ← FK → students.id (cascade)
extracurricular_id  ← FK → extracurriculars.id (cascade)
joined_at
status              ← AKTIF | NONAKTIF | KELUAR (default AKTIF)
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
extracurricular_id  ← FK → extracurriculars.id (cascade)
meeting_date
start_time
end_time
topic
location
status              ← DIJADWALKAN | BERLANGSUNG | SELESAI | DIBATALKAN
notes
created_at
updated_at
```

## attendance

```text
id
meeting_id          ← FK → meetings.id (cascade)
student_id          ← FK → students.id (cascade)
status              ← H | I | S | A | T (default H)
notes
recorded_by         ← FK → users.id (set null)
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
student_id          ← FK → students.id (cascade)
extracurricular_id  ← FK → extracurriculars.id (cascade)
period
payment_date
amount              ← double
payment_method      ← TUNAI | TRANSFER | LAINNYA (default TUNAI)
reference_number
proof_file
status              ← MENUNGGU_VERIFIKASI | LUNAS | DITOLAK
verification_note
verified_by         ← FK → users.id (set null)
verified_at
created_by          ← FK → users.id (set null)
created_at
updated_at
```

## payment_receipts

```text
id
payment_id          ← FK → payments.id (cascade)
receipt_number
file_url
generated_at
```

Constraint:

```text
UNIQUE(payment_id)
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
EXTRACURRICULAR  ← (includes bank_name, bank_account_number, bank_account_holder, qr_code_url)
   ↓
VERIFIED_BY USER
```

Info bank/QR per-ekskul:

```text
EXTRACURRICULAR
   ├─ bank_name
   ├─ bank_account_number
   ├─ bank_account_holder
   └─ qr_code_url    ← base64 data URI (data:image/...;base64,...) di kolom DB
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
eskulku/
│
├── app/
│   ├── login/page.tsx
│   ├── icon.png                    ← favicon
│   ├── layout.tsx
│   ├── globals.css
│   │
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── students/page.tsx
│   │   ├── extracurriculars/page.tsx
│   │   ├── meetings/page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── payments/page.tsx
│   │   └── audit/page.tsx
│   │
│   ├── pj/
│   │   ├── dashboard/page.tsx
│   │   ├── ekskuls/page.tsx           ← NEW: bank/QR settings
│   │   ├── meetings/page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── payments/page.tsx
│   │   └── reports/page.tsx
│   │
│   ├── siswa/
│   │   ├── dashboard/page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── payments/page.tsx          ← includes per-ekskul bank/QR panel
│   │   └── receipts/page.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── health/route.ts
│       ├── admin/
│       │   ├── users/route.ts
│       │   ├── students/route.ts
│       │   ├── extracurriculars/route.ts  ← includes bank/QR FormData
│       │   ├── meetings/route.ts          ← POST/PUT/DELETE
│       │   ├── payments/route.ts
│       │   └── audit/route.ts
│       ├── pj/
│       │   ├── dashboard/route.ts
│       │   ├── ekskuls/route.ts           ← NEW: GET + PUT bank/QR
│       │   ├── meetings/route.ts
│       │   └── payments/route.ts
│       ├── siswa/
│       │   ├── dashboard/route.ts
│       │   ├── my-ekskuls/route.ts        ← includes bank fields
│       │   ├── attendance/route.ts
│       │   ├── payments/route.ts
│       │   └── meetings/route.ts
│       └── export/
│           ├── attendance/route.ts        ← XLSX + PDF
│           └── payment/route.ts           ← receipt PDF with bank/QR
│
├── components/
│   ├── ui/                                ← shadcn/ui components
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar-nav.tsx
│   │   └── brand-logo.tsx                ← reusable logo component
│   ├── forms/
│   │   ├── extracurricular-form-dialog.tsx ← includes bank fields + QR upload
│   │   ├── student-form-dialog.tsx
│   │   └── meeting-form-dialog.tsx        ← includes edit/delete
│   ├── features/
│   │   ├── pj/
│   │   │   └── ekskul-payment-dialog.tsx  ← NEW: PJ bank/QR edit dialog
│   │   └── siswa/
│   │       └── siswa-payment-dialog.tsx   ← includes bank/QR info
│   ├── dashboard/                         ← stat-card, chart components
│   └── tables/                            ← data table components
│
├── lib/
│   ├── auth/                              ← NextAuth config
│   ├── rbac/                              ← role checking
│   ├── permissions/
│   ├── validation/                        ← Zod schemas
│   ├── pdf/
│   │   └── generate-receipt.ts            ← receipt PDF with bank/QR
│   ├── excel/
│   ├── nav.ts                             ← nav items per role
│   ├── icons.ts                           ← Lucide imports
│   └── utils.ts
│
├── db/
│   ├── schema.ts                          ← DRIZZLE SCHEMA (source of truth)
│   ├── index.ts                           ← db connection
│   └── seed.ts
│
├── drizzle/                               ← gitignored
│
├── public/
│   ├── logo-sekolah.png                   ← school emblem
│   ├── qr-bca.jpeg                        ← BCA QR code image (seed)
│   └── uploads/                           ← TIDAK DIPAKAI (base64 disimpan di DB)
│
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── AGENTS.md                              ← agent instructions
├── PRD-eskulku.md                         ← this file (source of truth)
└── .env
```

---

# 36. API

> Catatan: Semua route di bawah menggunakan prefix `/api/` kecuali public. Admin routes diawali `/api/admin/`, PJ `/api/pj/`, Siswa `/api/siswa/`.

## Auth

```http
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## Admin — Users

```http
GET    /api/admin/users
POST   /api/admin/users
GET    /api/admin/users?id=...
PUT    /api/admin/users?id=...
DELETE /api/admin/users?id=...
```

## Admin — Students (no NISN field)

```http
GET    /api/admin/students
POST   /api/admin/students
GET    /api/admin/students?id=...
PUT    /api/admin/students?id=...
DELETE /api/admin/students?id=...
```

## Admin — Extracurriculars (FormData: bank + QR)

```http
GET    /api/admin/extracurriculars
POST   /api/admin/extracurriculars       ← FormData (bank fields + QR file)
GET    /api/admin/extracurriculars?id=...
PUT    /api/admin/extracurriculars?id=... ← FormData (bank fields + QR file)
DELETE /api/admin/extracurriculars?id=...
```

## Admin — Meetings (POST/PUT/DELETE)

```http
GET    /api/admin/meetings
POST   /api/admin/meetings
PUT    /api/admin/meetings?id=...
DELETE /api/admin/meetings?id=...
```

## Admin — Payments + Audit

```http
GET    /api/admin/payments
POST   /api/admin/payments
GET    /api/admin/audit
```

## PJ

```http
GET    /api/pj/dashboard
GET    /api/pj/ekskuls                   ← includes bank/QR fields
PUT    /api/pj/ekskuls?id=...            ← bank/QR config (RBAC per-ekskul, FormData)
GET    /api/pj/meetings
POST   /api/pj/meetings
PUT    /api/pj/meetings?id=...
DELETE /api/pj/meetings?id=...
GET    /api/pj/payments
POST   /api/pj/payments?id=verify        ← verify payment
POST   /api/pj/payments?id=reject        ← reject payment
```

## Siswa

```http
GET    /api/siswa/dashboard
GET    /api/siswa/my-ekskuls             ← includes bank/QR fields
GET    /api/siswa/attendance
GET    /api/siswa/payments
POST   /api/siswa/payments               ← upload proof
GET    /api/siswa/meetings
```

## Export

```http
GET    /api/export/attendance/xlsx
GET    /api/export/attendance/pdf
GET    /api/export/payment/pdf           ← receipt PDF with bank/QR info
```

## Public

```http
GET    /api/health
```

Endpoint wajib melakukan ownership check untuk PJ/Guru.

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
13. Info bank/QR bersifat per-ekskul — setiap ekskul bisa punya rekening/QR yang berbeda.
14. Admin mengatur info bank/QR melalui form ekstrakurikuler (termasuk upload QR image).
15. PJ mengatur info bank/QR ekskul sendiri melalui `/pj/ekskuls`.
16. QR code bersifat opsional — jika tidak ada, tampilkan hanya nomor rekening.
17. Siswa melihat info bank/QR per ekskul di halaman pembayaran dan saat memilih ekskul di dialog bayar.
18. Receipt PDF mencantumkan baris "Dibayar Melalui" (bank, no rek, a.n.) jika info bank tersedia.
19. File upload QR: `image/jpeg`, `image/png`, maks 5MB, validasi MIME server-side, disimpan sebagai base64 data URI di kolom DB.

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

## Bukti Pembayaran

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

## QR Code Ekskul

```text
Allowed:
image/jpeg
image/png
```

Maksimal:

```text
5 MB
```

Sistem harus (kedua jenis upload):

- Memvalidasi MIME type.
- Membatasi ukuran.
- Menghindari executable upload.
- Tidak mempercayai nama file dari user.
- Membatasi akses file sesuai ownership.
- **Menyimpan file sebagai base64 data URI di kolom PostgreSQL** (`data:<mime>;base64,...`) — bukan ke filesystem/object storage (gratis & serverless-safe).
- Saat QR diganti/dihapus, cukup timpa/set kolom `qr_code_url` ke NULL (tidak ada file di disk untuk dihapus).

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
password: password123
role: ADMIN
```

## Guru/PJ

```text
guru1@example.com    → PJ Futsal
password: password123
role: PJ_GURU

guru2@example.com    → PJ Basket
password: password123
role: PJ_GURU
```

## Siswa

```text
siswa1@example.com
password: password123
role: SISWA

siswa2@example.com
password: password123
role: SISWA
```

## Ekskul + Info Pembayaran

| Nama | Kode | Bank | No Rekening | A.N. | QR Code |
|---|---|---|---|---|---|
| Futsal | EKS001 | BCA | 7005936063 | ABDUL AZIZ MUSLIM | `public/qr-bca.jpeg` |
| Basket | EKS002 | BSI | 1234567890 | Siti Rahma | — |
| Pramuka | EKS003 | — | — | — | — |
| Tahfidz | EKS004 | — | — | — | — |

Seed harus hanya digunakan untuk development/testing dan password demo tidak digunakan pada production.

---

# 53. Acceptance Criteria MVP

## Authentication

- [x] Admin dapat login.
- [x] PJ/Guru dapat login.
- [x] Siswa dapat login.
- [x] Logout berfungsi.
- [x] Protected routes berfungsi.

## RBAC

- [x] Admin dapat mengakses semua data.
- [x] PJ hanya dapat mengakses ekskul yang ditugaskan.
- [x] PJ dapat memverifikasi pembayaran ekskul sendiri.
- [x] PJ tidak dapat memverifikasi pembayaran ekskul lain.
- [x] Siswa hanya dapat melihat data miliknya.

## Ekskul

- [x] Admin dapat CRUD ekskul.
- [x] Admin dapat assign PJ.
- [x] Anggota dapat dikelola.
- [x] Admin dapat mengatur bank/QR per-ekskul.
- [x] PJ dapat mengatur bank/QR ekskul sendiri (Pengaturan Ekskul).

## Absensi

- [x] PJ dapat membuat pertemuan.
- [x] PJ dapat mengisi absensi.
- [x] Absensi tidak dapat duplikat.
- [x] Rekap mingguan tersedia.
- [x] Rekap bulanan tersedia.
- [x] XLSX tersedia.
- [x] PDF tersedia.
- [x] Edit & hapus pertemuan tersedia.

## Pembayaran

- [x] Pembayaran manual dapat dicatat.
- [x] Bukti pembayaran dapat diupload.
- [x] Status menunggu tersedia.
- [x] Admin dapat memverifikasi.
- [x] PJ dapat memverifikasi ekskul sendiri.
- [x] PJ tidak dapat memverifikasi ekskul lain.
- [x] Pembayaran dapat ditolak dengan alasan.
- [x] Audit verifikasi tersimpan.
- [x] Bukti pembayaran PDF dapat dibuat setelah LUNAS.
- [x] Info bank/QR per-ekskul ditampilkan ke siswa.
- [x] Siswa dapat download QR per-ekskul.

## UI/Branding

- [x] Branding "EKSKUL" konsisten (header, sidebar, metadata, footer, receipt).
- [x] School emblem logo (`logo-sekolah.png`) sebagai app logo.
- [x] Favicon (`app/icon.png`).
- [x] QR code di panel petunjuk pembayaran siswa.

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

## Phase 1 — Foundation ✅

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

## Phase 2 — Master Data ✅

```text
Users
↓
Students (tanpa NISN)
↓
Extracurriculars (dengan bank/QR fields)
↓
PJ/Guru
↓
Memberships
```

## Phase 3 — Absensi ✅

```text
Meetings (CRUD dengan edit/delete)
↓
Attendance
↓
Anti-duplicate
↓
Weekly Report
↓
Monthly Report
```

## Phase 4 — Export ✅

```text
XLSX
PDF (dengan info bank/QR)
```

## Phase 5 — Payment ✅

```text
Payment
↓
Upload Proof
↓
Verification
↓
Audit
↓
Receipt PDF (dengan info bank/QR)
↓
Per-Ekskul Payment Config (Admin + PJ)
↓
PJ Settings Page (/pj/ekskuls)
↓
Siswa Payment Info Panel (per-ekskul bank/QR)
```

## Phase 6 — Testing ⬜ (Belum dikerjakan)

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

## Phase 7 — UI Polish ✅

```text
Branding "EKSKUL" (bukan "EKS")
↓
School emblem logo
↓
Favicon
↓
QR code di petunjuk pembayaran
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
19. Info bank/QR per-ekskul ditampilkan ke siswa.
20. Admin dapat mengatur bank/QR per-ekskul.
21. PJ dapat mengatur bank/QR ekskul sendiri.
22. Edit & hapus pertemuan tersedia untuk Admin & PJ.
23. Branding "EKSKUL" konsisten di seluruh aplikasi.
24. Drizzle database tests pass.
25. TestSprite tests pass.
26. Tidak ditemukan celah authorization kritis pada pengujian MVP.

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

Info pembayaran per-ekskul:

```text
EACH EXTRACURRICULAR
   ├─ bank_name
   ├─ bank_account_number
   ├─ bank_account_holder
   └─ qr_code_url

Diatur oleh:
- Admin (via form ekskul)
- PJ (via /pj/ekskuls)

Ditampilkan ke:
- Siswa (halaman pembayaran, dialog bayar)
- Receipt PDF (bagian "Dibayar Melalui")
```

Kunci keamanan sistem adalah:

```text
ADMIN
  ↓
Full Access

PJ/GURU
  ↓
Access berdasarkan ekskul yang ditugaskan
(termasuk pengaturan bank/QR ekskul sendiri)

SISWA
  ↓
Access berdasarkan data miliknya
(termasuk info bank/QR ekskul yang diikuti)
```

Dengan desain ini, **PJ/Guru bukan sekadar operator absensi**, tetapi menjadi penanggung jawab ekskul yang memiliki kewenangan operasional, termasuk **verifikasi pembayaran siswa** dan **pengaturan info rekening/QR** pada ekskulnya sendiri, sementara Admin tetap memiliki akses penuh untuk supervisi dan audit.
