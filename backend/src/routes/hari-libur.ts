import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { tahun } = req.query;
    const where: any = {};
    if (tahun) {
      const year = parseInt(tahun as string);
      where.tanggal = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
    }
    const items = await prisma.hariLibur.findMany({ where, orderBy: { tanggal: "asc" } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat data hari libur" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.hariLibur.create({
      data: { tanggal: new Date(req.body.tanggal), keterangan: req.body.keterangan },
    });
    res.status(201).json(item);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Tanggal sudah terdaftar" });
    res.status(500).json({ error: "Gagal menambah hari libur" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.hariLibur.update({
      where: { id: String(req.params.id) },
      data: { tanggal: req.body.tanggal ? new Date(req.body.tanggal) : undefined, keterangan: req.body.keterangan },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengupdate hari libur" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.hariLibur.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus hari libur" });
  }
});

export default router;
