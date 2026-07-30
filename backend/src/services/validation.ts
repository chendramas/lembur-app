import prisma from "../prisma";

export async function validateOvertimeLimits(
  employeeId: string,
  tanggal: Date,
  totalMenit: number,
  excludeSplId?: string
): Promise<{ valid: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // Check 4 jam/hari
  const totalJamHari = totalMenit / 60;
  if (totalJamHari > 4) {
    warnings.push(`Lembur ${totalJamHari.toFixed(1)} jam/hari melebihi batas 4 jam. Diperlukan catatan justifikasi.`);
  }

  // Check 18 jam/minggu
  const dayOfWeek = tanggal.getDay(); // 0=Sun, 1=Mon...
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

  if (weeklyJam > 18) {
    warnings.push(`Total lembur minggu ini ${weeklyJam.toFixed(1)} jam melebihi batas 18 jam/minggu. Diperlukan catatan justifikasi.`);
  }

  return { valid: warnings.length === 0, warnings };
}
