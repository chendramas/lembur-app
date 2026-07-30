import prisma from "../prisma";

// Tidak ada batas lembur - hanya warning jika melebihi threshold tertentu
export const WARNING_THRESHOLD_MINGGU = 14;
export const MAX_JAM_PER_MINGGU = 999; // tidak ada batas
export const MAX_JAM_PER_HARI = 999; // tidak ada batas

export async function validateOvertimeLimits(
  employeeId: string,
  tanggal: Date,
  totalMenit: number,
  excludeSplId?: string
): Promise<{ valid: boolean; warnings: string[] }> {
  // Tidak ada validasi batas - semua diizinkan
  return { valid: true, warnings: [] };
}
