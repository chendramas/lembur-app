import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean
  await prisma.notification.deleteMany();
  await prisma.approvalHistory.deleteMany();
  await prisma.sPL.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.hariLibur.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.section.deleteMany();

  const hash = await bcrypt.hash("admin123", 10);
  const passHash = await bcrypt.hash("pass123", 10);

  // Sections
  const produksi = await prisma.section.create({ data: { nama: "Produksi" } });
  const gudang = await prisma.section.create({ data: { nama: "Gudang" } });

  // Users
  const admin = await prisma.user.create({
    data: { nama: "Administrator", username: "admin", passwordHash: hash, role: "ADMIN" },
  });
  const supervisor1 = await prisma.user.create({
    data: { nama: "Supervisor Produksi", username: "supervisor1", passwordHash: passHash, role: "SUPERVISOR", sectionId: produksi.id },
  });
  const supervisor2 = await prisma.user.create({
    data: { nama: "Supervisor Gudang", username: "supervisor2", passwordHash: passHash, role: "SUPERVISOR", sectionId: gudang.id },
  });
  const kabag1 = await prisma.user.create({
    data: { nama: "Kabag Produksi", username: "kabag1", passwordHash: passHash, role: "KABAG", sectionId: produksi.id },
  });
  const kabag2 = await prisma.user.create({
    data: { nama: "Kabag Gudang", username: "kabag2", passwordHash: passHash, role: "KABAG", sectionId: gudang.id },
  });
  const pga1 = await prisma.user.create({
    data: { nama: "PGA Utama", username: "pga1", passwordHash: passHash, role: "PGA" },
  });

  // Update sections with Kabag
  await prisma.section.update({ where: { id: produksi.id }, data: { kepalaBagianId: kabag1.id } });
  await prisma.section.update({ where: { id: gudang.id }, data: { kepalaBagianId: kabag2.id } });

  // Employees
  const employees = await Promise.all([
    prisma.employee.create({ data: { nama: "Ahmad Ridwan", nip: "EMP001", sectionId: produksi.id, gajiPokok: 5000000, jenisMingguKerja: "LIMA_HARI" } }),
    prisma.employee.create({ data: { nama: "Budi Santoso", nip: "EMP002", sectionId: produksi.id, gajiPokok: 5500000, jenisMingguKerja: "LIMA_HARI" } }),
    prisma.employee.create({ data: { nama: "Citra Dewi", nip: "EMP003", sectionId: produksi.id, gajiPokok: 6000000, jenisMingguKerja: "ENAM_HARI" } }),
    prisma.employee.create({ data: { nama: "Dedi Kurniawan", nip: "EMP004", sectionId: produksi.id, gajiPokok: 4500000, jenisMingguKerja: "LIMA_HARI" } }),
    prisma.employee.create({ data: { nama: "Eka Prasetyo", nip: "EMP005", sectionId: gudang.id, gajiPokok: 4800000, jenisMingguKerja: "LIMA_HARI" } }),
    prisma.employee.create({ data: { nama: "Fitri Handayani", nip: "EMP006", sectionId: gudang.id, gajiPokok: 5200000, jenisMingguKerja: "ENAM_HARI" } }),
    prisma.employee.create({ data: { nama: "Gilang Ramadhan", nip: "EMP007", sectionId: gudang.id, gajiPokok: 7000000, jenisMingguKerja: "LIMA_HARI" } }),
    prisma.employee.create({ data: { nama: "Hana Putri", nip: "EMP008", sectionId: produksi.id, gajiPokok: 8000000, jenisMingguKerja: "LIMA_HARI" } }),
  ]);

  // Hari Libur 2026
  const liburData = [
    { tanggal: new Date("2026-01-01"), keterangan: "Tahun Baru" },
    { tanggal: new Date("2026-01-27"), keterangan: "Isra Mi'raj" },
    { tanggal: new Date("2026-01-29"), keterangan: "Tahun Baru Imlek" },
    { tanggal: new Date("2026-03-29"), keterangan: "Nyepi" },
    { tanggal: new Date("2026-04-17"), keterangan: "Wafat Isa Almasih" },
    { tanggal: new Date("2026-05-01"), keterangan: "Hari Buruh" },
    { tanggal: new Date("2026-05-29"), keterangan: "Waisak" },
    { tanggal: new Date("2026-06-01"), keterangan: "Hari Lahir Pancasila" },
    { tanggal: new Date("2026-06-07"), keterangan: "Idul Adha" },
    { tanggal: new Date("2026-06-27"), keterangan: "Tahun Baru Islam" },
    { tanggal: new Date("2026-08-17"), keterangan: "Kemerdekaan RI" },
    { tanggal: new Date("2026-10-05"), keterangan: "Maulid Nabi" },
    { tanggal: new Date("2026-12-25"), keterangan: "Natal" },
  ];
  for (const l of liburData) {
    await prisma.hariLibur.create({ data: l });
  }

  // Absensi (July 2026, weekdays for 5 employees)
  const absensiRecords = [];
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2026, 6, day);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    for (let i = 0; i < 5; i++) {
      absensiRecords.push({
        employeeId: employees[i].id,
        tanggal: date,
        jamMasuk: "08:00",
        jamPulang: "17:00",
      });
    }
  }
  for (const a of absensiRecords) {
    await prisma.absensi.create({ data: a });
  }

  // Sample SPLs
  // 1. DRAFT
  const spl1 = await prisma.sPL.create({
    data: {
      employeeId: employees[0].id,
      tanggal: new Date("2026-07-15"),
      jenisHari: "KERJA",
      jamMulai: "17:00",
      jamSelesai: "20:00",
      totalJam: 3,
      totalMenit: 180,
      upahLembur: Math.floor(5000000 / 173) * 1.5 + Math.floor(5000000 / 173) * 2 * 2,
      alasan: "Perbaikan mesin produksi line A",
      status: "DRAFT",
      sectionId: produksi.id,
      createdById: supervisor1.id,
    },
  });

  // 2. PENGAJUAN_KABAG
  const spl2 = await prisma.sPL.create({
    data: {
      employeeId: employees[1].id,
      tanggal: new Date("2026-07-16"),
      jenisHari: "KERJA",
      jamMulai: "17:00",
      jamSelesai: "19:30",
      totalJam: 2.5,
      totalMenit: 150,
      upahLembur: Math.floor(5500000 / 173) * 1.5 + Math.floor(5500000 / 173) * 2,
      alasan: "Persiapan pengiriman ekspor",
      status: "PENGAJUAN_KABAG",
      sectionId: produksi.id,
      createdById: supervisor1.id,
    },
  });
  await prisma.approvalHistory.create({
    data: { splId: spl2.id, dariStatus: "DRAFT", keStatus: "PENGAJUAN_KABAG", olehUserId: supervisor1.id },
  });

  // 3. APPROVED (full workflow)
  const spl3 = await prisma.sPL.create({
    data: {
      employeeId: employees[4].id,
      tanggal: new Date("2026-07-10"),
      jenisHari: "KERJA",
      jamMulai: "17:00",
      jamSelesai: "21:00",
      totalJam: 4,
      totalMenit: 240,
      upahLembur: Math.floor(4800000 / 173) * 1.5 + Math.floor(4800000 / 173) * 2 * 3,
      alasan: "Inventarisasi gudang akhir bulan",
      status: "APPROVED",
      sectionId: gudang.id,
      createdById: supervisor2.id,
    },
  });
  // Approval history for full workflow
  for (const [dari, ke, oleh] of [
    ["DRAFT", "PENGAJUAN_KABAG", supervisor2.id],
    ["PENGAJUAN_KABAG", "PENGAJUAN_PGA", kabag2.id],
    ["PENGAJUAN_PGA", "APPROVED", pga1.id],
  ] as const) {
    await prisma.approvalHistory.create({
      data: { splId: spl3.id, dariStatus: dari as any, keStatus: ke as any, olehUserId: oleh },
    });
  }

  // 4. REJECTED_KABAG
  const spl4 = await prisma.sPL.create({
    data: {
      employeeId: employees[2].id,
      tanggal: new Date("2026-07-17"),
      jenisHari: "LIBUR",
      jamMulai: "09:00",
      jamSelesai: "17:00",
      totalJam: 8,
      totalMenit: 480,
      upahLembur: Math.floor(6000000 / 173) * 2 * 7 + Math.floor(6000000 / 173) * 3,
      alasan: "Pengecekan stok opname",
      status: "REJECTED_KABAG",
      sectionId: produksi.id,
      createdById: supervisor1.id,
    },
  });
  await prisma.approvalHistory.create({
    data: { splId: spl4.id, dariStatus: "DRAFT", keStatus: "PENGAJUAN_KABAG", olehUserId: supervisor1.id },
  });
  await prisma.approvalHistory.create({
    data: { splId: spl4.id, dariStatus: "PENGAJUAN_KABAG", keStatus: "REJECTED_KABAG", olehUserId: kabag1.id, catatan: "Terlalu banyak jam lembur untuk hari libur, mohon kurangi durasi" },
  });

  // 5. PENGAJUAN_PGA
  const spl5 = await prisma.sPL.create({
    data: {
      employeeId: employees[6].id,
      tanggal: new Date("2026-07-18"),
      jenisHari: "KERJA",
      jamMulai: "17:00",
      jamSelesai: "20:00",
      totalJam: 3,
      totalMenit: 180,
      upahLembur: Math.floor(7000000 / 173) * 1.5 + Math.floor(7000000 / 173) * 2 * 2,
      alasan: "Perawatan forklift gudang",
      status: "PENGAJUAN_PGA",
      sectionId: gudang.id,
      createdById: supervisor2.id,
    },
  });
  await prisma.approvalHistory.create({
    data: { splId: spl5.id, dariStatus: "DRAFT", keStatus: "PENGAJUAN_KABAG", olehUserId: supervisor2.id },
  });
  await prisma.approvalHistory.create({
    data: { splId: spl5.id, dariStatus: "PENGAJUAN_KABAG", keStatus: "PENGAJUAN_PGA", olehUserId: kabag2.id },
  });

  console.log("Seed completed!");
  console.log(`  ${await prisma.section.count()} sections`);
  console.log(`  ${await prisma.user.count()} users`);
  console.log(`  ${await prisma.employee.count()} employees`);
  console.log(`  ${await prisma.hariLibur.count()} hari libur`);
  console.log(`  ${await prisma.absensi.count()} absensi records`);
  console.log(`  ${await prisma.sPL.count()} SPL records`);
  console.log(`  ${await prisma.approvalHistory.count()} approval history records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
