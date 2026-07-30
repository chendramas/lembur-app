import prisma from "../prisma";
import { MingguKerja } from "@prisma/client";

export async function isHoliday(tanggal: Date, jenisMingguKerja: MingguKerja): Promise<boolean> {
  // Check hari_libur table
  const libur = await prisma.hariLibur.findFirst({
    where: { tanggal: tanggal },
  });
  if (libur) return true;

  // Check weekend
  const day = tanggal.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (jenisMingguKerja === "LIMA_HARI") {
    return day === 0 || day === 6; // Sat or Sun
  }
  // ENAM_HARI
  return day === 0; // Sun only
}

export async function detectJenisHari(tanggal: Date, jenisMingguKerja: MingguKerja): Promise<"KERJA" | "LIBUR"> {
  return (await isHoliday(tanggal, jenisMingguKerja)) ? "LIBUR" : "KERJA";
}
