import prisma from "../prisma";
import { JenisHari } from "@prisma/client";

// Round UP to nearest 30 minutes
function roundToNearest30(minutes: number): number {
  return Math.ceil(minutes / 30) * 30;
}

// Get multiplier for a specific hour
function getMultiplier(jenisHari: JenisHari, jamKe: number): number {
  if (jenisHari === "KERJA") {
    return jamKe === 1 ? 1.5 : 2.0;
  }
  // LIBUR
  if (jamKe <= 7) return 2.0;
  if (jamKe === 8) return 3.0;
  return 4.0;
}

export function calculateOvertime(
  jenisHari: JenisHari,
  jamMulai: string,
  jamSelesai: string,
  gajiPokok: number
): { totalMenit: number; totalJam: number; upahLembur: number; detail: Array<{ jam: number; multiplier: number; upah: number }> } {
  const [startH, startM] = jamMulai.split(":").map(Number);
  const [endH, endM] = jamSelesai.split(":").map(Number);

  let rawMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (rawMinutes <= 0) rawMinutes += 24 * 60; // cross midnight

  const totalMenit = rawMinutes;
  const roundedMinutes = roundToNearest30(rawMinutes);
  const totalJam = roundedMinutes / 60;

  const upahPerJam = Math.floor(gajiPokok / 173);
  const detail: Array<{ jam: number; multiplier: number; upah: number }> = [];
  let totalUpah = 0;

  // Hitung per menit untuk akurasi pecahan jam
  let menitTersisa = roundedMinutes;
  let jamKe = 1;

  while (menitTersisa > 0) {
    const menitDiJamIni = Math.min(menitTersisa, 60);
    const proporsi = menitDiJamIni / 60; // berapa proporsi jam penuh (0.5 untuk 30 menit, 1.0 untuk 60 menit)
    const multiplier = getMultiplier(jenisHari, jamKe);
    const upah = Math.floor(upahPerJam * multiplier * proporsi);
    
    detail.push({ jam: jamKe, multiplier, upah });
    totalUpah += upah;
    menitTersisa -= menitDiJamIni;
    jamKe++;
  }

  return { totalMenit, totalJam, upahLembur: totalUpah, detail };
}
