import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET — PGA and Admin can view
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, bulan, tahun } = req.query;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId as string;
    if (bulan && tahun) {
      const month = parseInt(bulan as string);
      const year = parseInt(tahun as string);
      where.tanggal = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
    }
    const items = await prisma.absensi.findMany({
      where,
      include: { employee: { select: { id: true, nama: true, nip: true } } },
      orderBy: { tanggal: "desc" },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat data absensi" });
  }
});

// CRUD — Admin only
router.post("/", authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.absensi.create({
      data: {
        employeeId: req.body.employeeId,
        tanggal: new Date(req.body.tanggal),
        jamMasuk: req.body.jamMasuk,
        jamPulang: req.body.jamPulang,
      },
    });
    res.status(201).json(item);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Absensi sudah ada untuk tanggal tersebut" });
    res.status(500).json({ error: "Gagal menambah absensi" });
  }
});

router.put("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.absensi.update({
      where: { id: String(req.params.id) },
      data: { jamMasuk: req.body.jamMasuk, jamPulang: req.body.jamPulang },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengupdate absensi" });
  }
});

router.delete("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.absensi.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus absensi" });
  }
});

export default router;
