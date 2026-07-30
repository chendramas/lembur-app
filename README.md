# Lembur App — Surat Perintah Lembur

Aplikasi pengelolaan Surat Perintah Lembur (SPL) berbasis web untuk perusahaan dengan struktur organisasi section/bagian.

**Repository:** https://github.com/chendramas/lembur-app

## Fitur

- **Workflow SPL**: Draft → Pengajuan Kabag → Pengajuan PGA → Approved (atau reject di tiap tahap)
- **Role-Based Access Control**: Supervisor, Kepala Bagian (Kabag), PGA, Admin
- **Perhitungan Lembur Otomatis**: Dengan multiplier berbeda untuk hari kerja dan hari libur
- **Validasi Batas Lembur**: Warning otomatis untuk 4 jam/hari dan 18 jam/minggu
- **Audit Trail**: Riwayat lengkap setiap perubahan status SPL
- **Data Absensi**: Perbandingan SPL vs absensi untuk validasi PGA
- **Master Data**: Kelola karyawan, section, hari libur, dan absensi
- **Dashboard**: Ringkasan status SPL, biaya lembur per section, dan warning karyawan

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | JWT + bcryptjs |

## Struktur Proyek

```
spl-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── index.ts
│   │   ├── prisma.ts
│   │   ├── middleware/auth.ts
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
└── README.md
```

## Cara Menjalankan

### Prasyarat
- Node.js 20+
- PostgreSQL 16+

### Setup Database
```bash
createdb spl_app
```

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev
```
Backend berjalan di http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di http://localhost:5173

### Akun Demo
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| supervisorproduksi | pass123 | Supervisor (Produksi) |
| supervisorgudang | pass123 | Supervisor (Gudang) |
| kabagproduksi | pass123 | Kabag (Produksi) |
| kabaggudang | pass123 | Kabag (Gudang) |
| pga1 | pass123 | PGA |

## Perhitungan Lembur

```
upah_per_jam = gaji_pokok / 173
total_upah = SUM(upah_per_jam × multiplier)
```

### Tabel Multiplier

**Hari Kerja:**
- Jam ke-1: × 1.5
- Jam ke-2 dst: × 2.0

**Hari Libur:**
- Jam ke-1 s/d ke-7: × 2.0
- Jam ke-8: × 3.0
- Jam ke-9 dst: × 4.0

### Kebijakan Pembulatan
Pembulatan ke atas per 30 menit. Contoh:
- 60 menit → 1.0 jam
- 62 menit → 1.5 jam
- 90 menit → 1.5 jam
- 91 menit → 2.0 jam

## License

Portfolio project — built for demonstration purposes.
