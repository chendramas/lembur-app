import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { WARNING_THRESHOLD_MINGGU, MAX_JAM_PER_MINGGU } from "../services/validation";

const router = Router();
router.use(authenticate);

router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const sectionFilter: any = {};

    if (role === "SUPERVISOR") {
      sectionFilter.sectionId = req.user!.sectionId;
    } else if (role === "KABAG") {
      const section = await prisma.section.findFirst({ where: { kepalaBagianId: req.user!.id } });
      if (section) sectionFilter.sectionId = section.id;
    }

    // Count per status
    const statuses = ["DRAFT", "PENGAJUAN_KABAG", "PENGAJUAN_PGA", "APPROVED", "REJECTED_KABAG", "REJECTED_PGA"];
    const totalPerStatus: Record<string, number> = {};
    for (const status of statuses) {
      totalPerStatus[status] = await prisma.sPL.count({
        where: { ...sectionFilter, status: status as any, isArchived: false },
      });
    }

    // Total biaya per section per bulan (current month)
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

    const sections = await prisma.section.findMany({
      include: {
        spls: {
          where: { status: "APPROVED", tanggal: { gte: startOfMonth, lt: endOfMonth } },
          select: { upahLembur: true },
        },
      },
    });

    const totalBiayaPerSection = sections.map((s) => ({
      sectionId: s.id,
      sectionNama: s.nama,
      totalBiaya: s.spls.reduce((sum, spl) => sum + spl.upahLembur, 0),
      jumlahSPL: s.spls.length,
    }));

    // Weekly warnings (employees approaching/exceeding 18 jam/minggu)
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);

    const weeklySpls = await prisma.sPL.groupBy({
      by: ["employeeId"],
      where: {
        tanggal: { gte: monday, lt: sunday },
        status: { notIn: ["DRAFT", "REJECTED_KABAG", "REJECTED_PGA"] },
        ...sectionFilter,
      },
      _sum: { totalMenit: true },
    });

    const weeklyWarnings = [];
    for (const ws of weeklySpls) {
      const totalJam = (ws._sum.totalMenit || 0) / 60;
      if (totalJam >= WARNING_THRESHOLD_MINGGU) {
        const emp = await prisma.employee.findUnique({ where: { id: ws.employeeId } });
        weeklyWarnings.push({
          employeeId: ws.employeeId,
          employeeNama: emp?.nama,
          totalJam: Math.round(totalJam * 10) / 10,
          exceeded: totalJam > MAX_JAM_PER_MINGGU,
        });
      }
    }

    res.json({ totalPerStatus, totalBiayaPerSection, weeklyWarnings });
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat dashboard" });
  }
});

export default router;
