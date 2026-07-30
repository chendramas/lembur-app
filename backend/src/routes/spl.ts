import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { calculateOvertime } from "../services/overtime";
import { validateOvertimeLimits } from "../services/validation";
import { detectJenisHari } from "../services/holiday";
import { SPLStatus, JenisHari } from "@prisma/client";

const router = Router();
router.use(authenticate);

// Helper: create notification
async function notify(userId: string, message: string, splId?: string) {
  await prisma.notification.create({ data: { userId, message, splId } });
}

// GET /api/spl — list with filters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { status, sectionId, bulan, tahun, archived } = req.query;
    const where: any = {};

    // Role-based filtering
    if (req.user!.role === "SUPERVISOR") {
      where.sectionId = req.user!.sectionId;
    } else if (req.user!.role === "KABAG") {
      const section = await prisma.section.findFirst({ where: { kepalaBagianId: req.user!.id } });
      if (section) where.sectionId = section.id;
    }
    // PGA and ADMIN see all

    if (status) where.status = status as SPLStatus;
    if (sectionId) where.sectionId = sectionId as string;
    if (archived === "true") where.isArchived = true;
    else if (archived !== "all") where.isArchived = false;

    if (bulan && tahun) {
      const month = parseInt(bulan as string);
      const year = parseInt(tahun as string);
      where.tanggal = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const spls = await prisma.sPL.findMany({
      where,
      include: {
        employee: { select: { id: true, nama: true, nip: true } },
        section: { select: { id: true, nama: true } },
        createdBy: { select: { id: true, nama: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(spls);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat data SPL" });
  }
});

// GET /api/spl/:id — detail
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const spl = await prisma.sPL.findUnique({
      where: { id: String(req.params.id) },
      include: {
        employee: true,
        section: true,
        createdBy: { select: { id: true, nama: true, role: true } },
        approvalHistory: {
          include: { olehUser: { select: { id: true, nama: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });
    res.json(spl);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat detail SPL" });
  }
});

// POST /api/spl — create
router.post("/", authorize("SUPERVISOR"), async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, tanggal, jenisHari, jamMulai, jamSelesai, alasan, catatanRevisi } = req.body;

    if (!employeeId || !tanggal || !jamMulai || !jamSelesai || !alasan) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    if (employee.sectionId !== req.user!.sectionId) {
      return res.status(403).json({ error: "Karyawan bukan di section Anda" });
    }

    const tanggalDate = new Date(tanggal);
    const finalJenisHari = jenisHari || (await detectJenisHari(tanggalDate, employee.jenisMingguKerja));

    const calc = calculateOvertime(finalJenisHari, jamMulai, jamSelesai, employee.gajiPokok);
    const validation = await validateOvertimeLimits(employeeId, tanggalDate, calc.totalMenit);

    if (!validation.valid && !catatanRevisi) {
      return res.status(400).json({ error: "Diperlukan catatan justifikasi", warnings: validation.warnings });
    }

    const spl = await prisma.sPL.create({
      data: {
        employeeId,
        tanggal: tanggalDate,
        jenisHari: finalJenisHari as JenisHari,
        jamMulai,
        jamSelesai,
        totalJam: calc.totalJam,
        totalMenit: calc.totalMenit,
        upahLembur: calc.upahLembur,
        alasan,
        catatanRevisi: catatanRevisi || null,
        status: "DRAFT",
        sectionId: employee.sectionId,
        createdById: req.user!.id,
      },
      include: { employee: true, section: true },
    });

    res.status(201).json({ ...spl, warnings: validation.warnings });
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat SPL" });
  }
});

// PUT /api/spl/:id — update (only DRAFT/REJECTED)
router.put("/:id", authorize("SUPERVISOR"), async (req: AuthRequest, res: Response) => {
  try {
    const spl = await prisma.sPL.findUnique({ where: { id: String(req.params.id) } });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });
    if (spl.createdById !== req.user!.id) return res.status(403).json({ error: "Bukan SPL Anda" });
    if (!["DRAFT", "REJECTED_KABAG", "REJECTED_PGA"].includes(spl.status)) {
      return res.status(400).json({ error: "SPL hanya bisa diedit saat status DRAFT atau REJECTED" });
    }

    const { employeeId, tanggal, jenisHari, jamMulai, jamSelesai, alasan, catatanRevisi } = req.body;
    const emp = employeeId ? await prisma.employee.findUnique({ where: { id: employeeId } }) : null;
    const tanggalDate = tanggal ? new Date(tanggal) : spl.tanggal;
    const finalJenisHari = jenisHari || spl.jenisHari;
    const finalJamMulai = jamMulai || spl.jamMulai;
    const finalJamSelesai = jamSelesai || spl.jamSelesai;
    const gajiPokok = emp?.gajiPokok || (await prisma.employee.findUnique({ where: { id: spl.employeeId } }))!.gajiPokok;

    const calc = calculateOvertime(finalJenisHari, finalJamMulai, finalJamSelesai, gajiPokok);
    const validation = await validateOvertimeLimits(employeeId || spl.employeeId, tanggalDate, calc.totalMenit, spl.id);

    if (!validation.valid && !catatanRevisi && !spl.catatanRevisi) {
      return res.status(400).json({ error: "Diperlukan catatan justifikasi", warnings: validation.warnings });
    }

    const updated = await prisma.sPL.update({
      where: { id: String(req.params.id) },
      data: {
        ...(employeeId && { employeeId }),
        ...(tanggal && { tanggal: tanggalDate }),
        ...(jenisHari && { jenisHari: finalJenisHari as JenisHari }),
        ...(jamMulai && { jamMulai: finalJamMulai }),
        ...(jamSelesai && { jamSelesai: finalJamSelesai }),
        ...(alasan && { alasan }),
        totalJam: calc.totalJam,
        totalMenit: calc.totalMenit,
        upahLembur: calc.upahLembur,
        status: "DRAFT",
        ...(catatanRevisi && { catatanRevisi }),
      },
      include: { employee: true, section: true },
    });

    res.json({ ...updated, warnings: validation.warnings });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengupdate SPL" });
  }
});

// DELETE /api/spl/:id (only DRAFT/REJECTED)
router.delete("/:id", authorize("SUPERVISOR"), async (req: AuthRequest, res: Response) => {
  try {
    const spl = await prisma.sPL.findUnique({ where: { id: String(req.params.id) } });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });
    if (spl.createdById !== req.user!.id) return res.status(403).json({ error: "Bukan SPL Anda" });
    if (!["DRAFT", "REJECTED_KABAG", "REJECTED_PGA"].includes(spl.status)) {
      return res.status(400).json({ error: "SPL hanya bisa dihapus saat status DRAFT atau REJECTED" });
    }

    await prisma.approvalHistory.deleteMany({ where: { splId: spl.id } });
    await prisma.notification.deleteMany({ where: { splId: spl.id } });
    await prisma.sPL.delete({ where: { id: spl.id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus SPL" });
  }
});

// POST /api/spl/:id/submit
router.post("/:id/submit", authorize("SUPERVISOR"), async (req: AuthRequest, res: Response) => {
  try {
    const spl = await prisma.sPL.findUnique({
      where: { id: String(req.params.id) },
      include: { section: true },
    });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });
    if (spl.createdById !== req.user!.id) return res.status(403).json({ error: "Bukan SPL Anda" });
    if (spl.status !== "DRAFT" && spl.status !== "REJECTED_KABAG" && spl.status !== "REJECTED_PGA") {
      return res.status(400).json({ error: "SPL hanya bisa disubmit dari status DRAFT atau REJECTED" });
    }

    const dariStatus = spl.status;
    const updated = await prisma.sPL.update({
      where: { id: spl.id },
      data: { status: "PENGAJUAN_KABAG" },
    });

    await prisma.approvalHistory.create({
      data: { splId: spl.id, dariStatus: dariStatus as SPLStatus, keStatus: "PENGAJUAN_KABAG", olehUserId: req.user!.id },
    });

    // Notify Kabag
    if (spl.section.kepalaBagianId) {
      await notify(spl.section.kepalaBagianId, `SPL baru menunggu persetujuan Anda`, spl.id);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Gagal menyubmit SPL" });
  }
});

// POST /api/spl/:id/approve
router.post("/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    const spl = await prisma.sPL.findUnique({
      where: { id: String(req.params.id) },
      include: { section: true, employee: true },
    });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });

    let dariStatus: SPLStatus;
    let keStatus: SPLStatus;
    let allowed = false;

    if (req.user!.role === "KABAG" && spl.status === "PENGAJUAN_KABAG") {
      const section = await prisma.section.findFirst({ where: { kepalaBagianId: req.user!.id } });
      if (!section || section.id !== spl.sectionId) return res.status(403).json({ error: "Bukan section Anda" });
      dariStatus = "PENGAJUAN_KABAG";
      keStatus = "PENGAJUAN_PGA";
      allowed = true;
    } else if (req.user!.role === "PGA" && spl.status === "PENGAJUAN_PGA") {
      dariStatus = "PENGAJUAN_PGA";
      keStatus = "APPROVED";
      allowed = true;
    }

    if (!allowed) return res.status(400).json({ error: "Tidak dapat approve SPL ini" });

    const updated = await prisma.sPL.update({
      where: { id: spl.id },
      data: { status: keStatus },
    });

    await prisma.approvalHistory.create({
      data: { splId: spl.id, dariStatus, keStatus, olehUserId: req.user!.id },
    });

    // Notify creator
    await notify(spl.createdById, `SPL Anda telah disetujui (${keStatus})`, spl.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Gagal approve SPL" });
  }
});

// POST /api/spl/:id/reject
router.post("/:id/reject", async (req: AuthRequest, res: Response) => {
  try {
    const { catatan } = req.body;
    if (!catatan) return res.status(400).json({ error: "Catatan alasan penolakan wajib diisi" });

    const spl = await prisma.sPL.findUnique({
      where: { id: String(req.params.id) },
      include: { section: true },
    });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });

    let dariStatus: SPLStatus;
    let keStatus: SPLStatus;
    let allowed = false;

    if (req.user!.role === "KABAG" && spl.status === "PENGAJUAN_KABAG") {
      const section = await prisma.section.findFirst({ where: { kepalaBagianId: req.user!.id } });
      if (!section || section.id !== spl.sectionId) return res.status(403).json({ error: "Bukan section Anda" });
      dariStatus = "PENGAJUAN_KABAG";
      keStatus = "REJECTED_KABAG";
      allowed = true;
    } else if (req.user!.role === "PGA" && spl.status === "PENGAJUAN_PGA") {
      dariStatus = "PENGAJUAN_PGA";
      keStatus = "REJECTED_PGA";
      allowed = true;
    }

    if (!allowed) return res.status(400).json({ error: "Tidak dapat reject SPL ini" });

    const updated = await prisma.sPL.update({
      where: { id: spl.id },
      data: { status: keStatus },
    });

    await prisma.approvalHistory.create({
      data: { splId: spl.id, dariStatus, keStatus, olehUserId: req.user!.id, catatan },
    });

    // Notify creator
    await notify(spl.createdById, `SPL Anda ditolak: ${catatan}`, spl.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Gagal reject SPL" });
  }
});

// POST /api/spl/:id/archive
router.post("/:id/archive", async (req: AuthRequest, res: Response) => {
  try {
    const spl = await prisma.sPL.findUnique({ where: { id: String(req.params.id) } });
    if (!spl) return res.status(404).json({ error: "SPL tidak ditemukan" });
    if (spl.status !== "APPROVED") return res.status(400).json({ error: "Hanya SPL yang sudah disetujui yang bisa diarsipkan" });

    const updated = await prisma.sPL.update({
      where: { id: spl.id },
      data: { isArchived: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengarsipkan SPL" });
  }
});

// GET /api/spl/holiday-check — check jenis hari for a date
router.get("/holiday-check", async (req: AuthRequest, res: Response) => {
  try {
    const { tanggal, employeeId } = req.query;
    if (!tanggal || !employeeId) return res.status(400).json({ error: "Tanggal dan employeeId wajib diisi" });

    const employee = await prisma.employee.findUnique({ where: { id: employeeId as string } });
    if (!employee) return res.status(404).json({ error: "Karyawan tidak ditemukan" });

    const jenisHari = await detectJenisHari(new Date(tanggal as string), employee.jenisMingguKerja);
    res.json({ jenisHari });
  } catch (err) {
    res.status(500).json({ error: "Gagal memeriksa hari" });
  }
});

export default router;
