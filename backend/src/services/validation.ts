import prisma from "../prisma";

// Batas lembur - single source of truth
export const MAX_JAM_PER_HARI = 4;
export const MAX_JAM_PER_MINGGU = 18;
export const WARNING_THRESHOLD_MINGGU = 14; // mulai warning sebelum batas 18 jam

export async function validateOvertimeLimits(
  employeeId: string,
  tanggal: Date,
  totalMenit: number,
  excludeSplId?: string
): Promise<{ valid: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // Check jam/hari
  const totalJamHari = totalMenit / 60;
  if (totalJamHari > MAX_JAM_PER_HARI) {
    warnings.push(`Lembur ${totalJamHari.toFixed(1)} jam/hari melebihi batas ${MAX_JAM_PER_HARI} jam. Diperlukan catatan justifikasi.`);
  }

  // Check jam/minggu
  const dayOfWeek = tanggal.getDay();
  const monday = new Date(tanggal);
  monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const weeklySpls = await prisma.sPL.findMany({
    where: {
      employeeId,
      tanggal: { gte: monday, lt: sunday },
      status: { notIn: ["DRAFT", "REJECTED_KABAG", "REJECTED_PGA"] },
      ...(excludeSplId ? { id: { not: excludeSplId } } : {}),
    },
    select: { totalMenit: true },
  });

  const weeklyMenit = weeklySpls.reduce((sum, s) => sum + s.totalMenit, 0) + totalMenit;
  const weeklyJam = weeklyMenit / 60;

  if (weeklyJam > MAX_JAM_PER_MINGGU) {
    warnings.push(`Total lembur minggu ini ${weeklyJam.toFixed(1)} jam melebihi batas ${MAX_JAM_PER_MINGGU} jam/minggu. Diperlukan catatan justifikasi.`);
  }

  return { valid: warnings.length === 0, warnings };
}
