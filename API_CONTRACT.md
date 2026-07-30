# SPL App — API Contract

## Tech Stack
- Backend: Express + TypeScript + Prisma 7 + PostgreSQL
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4
- Ports: Backend 3001, Frontend 5173

## Authentication
- JWT Bearer token in Authorization header
- Token stored in localStorage on frontend
- 401 → clear token, redirect to /login

## Roles
- SUPERVISOR: create/edit/delete SPL for their section (DRAFT/REJECTED only)
- KABAG: approve/reject SPL for their section (PENGAJUAN_KABAG only)
- PGA: approve/reject all SPL (PENGAJUAN_PGA only), access absensi
- ADMIN: manage master data (employees, sections, hari_libur, absensi)

## Data Model (Prisma Schema)

```prisma
model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nama         String
  username     String   @unique
  passwordHash String   @map("password_hash")
  role         Role
  sectionId    String?  @map("section_id") @db.Uuid
  section      Section? @relation(fields: [sectionId], references: [id])
  createdAt    DateTime @default(now()) @map("created_at")
  @@map("users")
}

enum Role {
  SUPERVISOR
  KABAG
  PGA
  ADMIN
}

model Section {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nama           String
  kepalaBagianId String?      @map("kepala_bagian_id") @db.Uuid
  kepalaBagian   User?        @relation("KabagSection", fields: [kepalaBagianId], references: [id])
  employees      Employee[]
  spls           SPL[]
  users          User[]
  createdAt      DateTime     @default(now()) @map("created_at")
  @@map("sections")
}

model Employee {
  id              String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nama            String
  nip             String         @unique
  sectionId       String         @map("section_id") @db.Uuid
  section         Section        @relation(fields: [sectionId], references: [id])
  gajiPokok       Int            @map("gaji_pokok") // Rupiah, integer
  jenisMingguKerja MingguKerja   @map("jenis_minggu_kerja") @default(LIMA_HARI)
  spls            SPL[]
  absensi         Absensi[]
  createdAt       DateTime       @default(now()) @map("created_at")
  @@map("employees")
}

enum MingguKerja {
  LIMA_HARI   // Mon-Fri work, Sat-Sun holiday
  ENAM_HARI   // Mon-Sat work, Sun holiday
}

model SPL {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId    String        @map("employee_id") @db.Uuid
  employee      Employee      @relation(fields: [employeeId], references: [id])
  tanggal       DateTime      @db.Date
  jenisHari     JenisHari     @map("jenis_hari")
  jamMulai      String        @map("jam_mulai") // "HH:MM" format
  jamSelesai    String        @map("jam_selesai") // "HH:MM" format
  totalJam      Float         @map("total_jam") // computed, in hours (after rounding)
  totalMenit    Int           @map("total_menit") // raw minutes before rounding
  upahLembur    Int           @map("upah_lembur") // computed, Rupiah
  alasan        String
  status        SPLStatus     @default(DRAFT)
  sectionId     String        @map("section_id") @db.Uuid
  section       Section       @relation(fields: [sectionId], references: [id])
  createdById   String        @map("created_by") @db.Uuid
  createdBy     User          @relation("SPLCreator", fields: [createdById], references: [id])
  catatanRevisi String?       @map("catatan_revisi") // justification for override
  isArchived    Boolean       @default(false) @map("is_archived")
  approvalHistory ApprovalHistory[]
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  @@map("spl")
}

enum JenisHari {
  KERJA  // regular workday
  LIBUR  // holiday/weekend
}

enum SPLStatus {
  DRAFT
  PENGAJUAN_KABAG
  PENGAJUAN_PGA
  APPROVED
  REJECTED_KABAG
  REJECTED_PGA
}

model ApprovalHistory {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  splId      String   @map("spl_id") @db.Uuid
  spl        SPL      @relation(fields: [splId], references: [id])
  dariStatus SPLStatus @map("dari_status")
  keStatus   SPLStatus @map("ke_status")
  olehUserId String   @map("oleh_user_id") @db.Uuid
  olehUser   User     @relation("ApprovalUser", fields: [olehUserId], references: [id])
  catatan    String?
  createdAt  DateTime @default(now()) @map("created_at")
  @@map("approval_history")
}

model Absensi {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId String   @map("employee_id") @db.Uuid
  employee   Employee @relation(fields: [employeeId], references: [id])
  tanggal    DateTime @db.Date
  jamMasuk   String   @map("jam_masuk") // "HH:MM"
  jamPulang  String   @map("jam_pulang") // "HH:MM"
  @@unique([employeeId, tanggal])
  @@map("absensi")
}

model HariLibur {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tanggal    DateTime @db.Date @unique
  keterangan String
  @@map("hari_libur")
}
```

## API Endpoints

### Auth
```
POST /api/auth/login          { username, password } → { token, user: { id, nama, role, sectionId } }
GET  /api/auth/me              → { id, nama, role, sectionId, sectionNama }
```

### SPL (Supervisor workflow)
```
GET    /api/spl                ?status=DRAFT&sectionId=xxx&bulan=7&tahun=2026 → SPL[] (filtered by role)
GET    /api/spl/:id            → SPL + employee + approvalHistory
POST   /api/spl                { employeeId, tanggal, jenisHari, jamMulai, jamSelesai, alasan, catatanRevisi? } → SPL
PUT    /api/spl/:id            { ...fields } → SPL (only DRAFT/REJECTED)
DELETE /api/spl/:id            → { success } (only DRAFT/REJECTED)
POST   /api/spl/:id/submit     → SPL (DRAFT → PENGAJUAN_KABAG)
```

### SPL Approval (Kabag)
```
POST   /api/spl/:id/approve    → SPL (PENGAJUAN_KABAG → PENGAJUAN_PGA)
POST   /api/spl/:id/reject     { catatan } → SPL (PENGAJUAN_KABAG → REJECTED_KABAG)
```

### SPL Approval (PGA)
```
POST   /api/spl/:id/approve    → SPL (PENGAJUAN_PGA → APPROVED)
POST   /api/spl/:id/reject     { catatan } → SPL (PENGAJUAN_PGA → REJECTED_PGA)
```

### SPL Archive
```
POST   /api/spl/:id/archive    → SPL (APPROVED only, sets isArchived=true)
```

### Dashboard
```
GET /api/dashboard/stats        → { totalPerStatus: { DRAFT: n, ... }, totalBiayaPerSection: [...], weeklyWarnings: [...] }
```

### Master Data (Admin only)
```
CRUD /api/employees             GET list, POST create, PUT /:id, DELETE /:id
CRUD /api/sections              GET list, POST create, PUT /:id, DELETE /:id
CRUD /api/hari-libur            GET list (filter by year), POST create, PUT /:id, DELETE /:id
CRUD /api/absensi               GET list (filter by employee+month), POST create, PUT /:id, DELETE /:id
CRUD /api/users                 GET list, POST create, PUT /:id, DELETE /:id
```

### Notifications
```
GET  /api/notifications         → Notification[] (unread first)
POST /api/notifications/:id/read → { success }
```

## Overtime Calculation Rules

### Rounding
- Default: round UP to nearest 30 minutes
- Example: 62 minutes → 90 minutes (1.5 hours)
- Configurable via config table

### Multiplier Table
Hari Kerja:
- Jam ke-1: × 1.5
- Jam ke-2+: × 2.0

Hari Libur:
- Jam ke-1 s/d ke-7: × 2.0
- Jam ke-8: × 3.0
- Jam ke-9+: × 4.0

### Formula
```
upah_per_jam = gaji_pokok / 173
total_upah = SUM(upah_per_jam × multiplier(jenis_hari, jam_ke_n) × 1_jam) for each hour
```

### Validation (PP 35/2021)
- Max 4 jam/hari → warning if exceeded (not blocked)
- Max 18 jam/minggu → warning if exceeded (not blocked)
- Both need justification text (catatanRevisi) to proceed

## Holiday Logic
- `jenis_hari` is determined by: (1) if tanggal in hari_libur table → LIBUR, (2) if employee.jenisMingguKerja = LIMA_HARI and day is Sat/Sun → LIBUR, (3) if ENAM_HARI and day is Sun → LIBUR, else → KERJA
- Frontend should auto-detect and suggest, but allow override

## Seed Data

### Users
| username | password | role | section |
|----------|----------|------|---------|
| admin | admin123 | ADMIN | - |
| supervisor1 | pass123 | SUPERVISOR | Produksi |
| supervisor2 | pass123 | SUPERVISOR | Gudang |
| kabag1 | pass123 | KABAG | Produksi |
| kabag2 | pass123 | KABAG | Gudang |
| pga1 | pass123 | PGA | - |

### Sections
- Produksi (kabag: kabag1)
- Gudang (kabag: kabag2)

### Employees (8-10)
Mix of LIMA_HARI and ENAM_HARI, gajiPokok range 4000000-8000000

### Hari Libur 2026
- 1 Jan (Tahun Baru), 27 Jan (Isra Mi'raj), 29 Jan (Imlek), 29 Mar (Nyepi), 17 Apr (Wafat Isa), 1 May (Buruh), 29 May (Waisak), 1 Jun (Pancasila), 7 Jun (Idul Adha), 27 Jun (Muharram), 17 Aug (Kemerdekaan), 5 Oct (Maulid), 25 Dec (Natal)

### Absensi (dummy for current month)
Create ~20 records for 5 employees for Jul 2026

### Sample SPL
- 2-3 DRAFT SPL
- 1 PENGAJUAN_KABAG
- 1 APPROVED (completed workflow)
