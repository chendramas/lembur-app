import prisma from "../prisma";
import { JenisHari } from "@prisma/client";

// Round UP to nearest full hour
function roundToNearestHour(minutes: number): number {
  return Math.ceil(minutes / 60) * 60;
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
  const roundedMinutes = roundToNearestHour(rawMinutes);
  const totalJam = roundedMinutes / 60; // selalu integer

  const upahPerJam = Math.floor(gajiPokok / 173);
  const detail: Array<{ jam: number; multiplier: number; upah: number }> = [];
  let totalUpah = 0;

  for (let i = 1; i <= totalJam; i++) {
    const multiplier = getMultiplier(jenisHari, i);
    const upah = Math.floor(upahPerJam * multiplier);
    detail.push({ jam: i, multiplier, upah });
    totalUpah += upah;
  }

  return { totalMenit, totalJam, upahLembur: totalUpah, detail };
}
