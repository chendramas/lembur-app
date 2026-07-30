-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERVISOR', 'KABAG', 'PGA', 'ADMIN');

-- CreateEnum
CREATE TYPE "MingguKerja" AS ENUM ('LIMA_HARI', 'ENAM_HARI');

-- CreateEnum
CREATE TYPE "JenisHari" AS ENUM ('KERJA', 'LIBUR');

-- CreateEnum
CREATE TYPE "SPLStatus" AS ENUM ('DRAFT', 'PENGAJUAN_KABAG', 'PENGAJUAN_PGA', 'APPROVED', 'REJECTED_KABAG', 'REJECTED_PGA');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "section_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nama" TEXT NOT NULL,
    "kepala_bagian_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nama" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "section_id" UUID NOT NULL,
    "gaji_pokok" INTEGER NOT NULL,
    "jenis_minggu_kerja" "MingguKerja" NOT NULL DEFAULT 'LIMA_HARI',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spl" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis_hari" "JenisHari" NOT NULL,
    "jam_mulai" TEXT NOT NULL,
    "jam_selesai" TEXT NOT NULL,
    "total_jam" DOUBLE PRECISION NOT NULL,
    "total_menit" INTEGER NOT NULL,
    "upah_lembur" INTEGER NOT NULL,
    "alasan" TEXT NOT NULL,
    "status" "SPLStatus" NOT NULL DEFAULT 'DRAFT',
    "section_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "catatan_revisi" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "spl_id" UUID NOT NULL,
    "dari_status" "SPLStatus" NOT NULL,
    "ke_status" "SPLStatus" NOT NULL,
    "oleh_user_id" UUID NOT NULL,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absensi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_masuk" TEXT NOT NULL,
    "jam_pulang" TEXT NOT NULL,

    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hari_libur" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT NOT NULL,

    CONSTRAINT "hari_libur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "spl_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nip_key" ON "employees"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "absensi_employee_id_tanggal_key" ON "absensi"("employee_id", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "hari_libur_tanggal_key" ON "hari_libur"("tanggal");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_kepala_bagian_id_fkey" FOREIGN KEY ("kepala_bagian_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spl" ADD CONSTRAINT "spl_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spl" ADD CONSTRAINT "spl_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spl" ADD CONSTRAINT "spl_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_spl_id_fkey" FOREIGN KEY ("spl_id") REFERENCES "spl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_oleh_user_id_fkey" FOREIGN KEY ("oleh_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_spl_id_fkey" FOREIGN KEY ("spl_id") REFERENCES "spl"("id") ON DELETE SET NULL ON UPDATE CASCADE;
