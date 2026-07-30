import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.use(authorize("ADMIN"));

// GET /
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.section.findMany({ include: { kepalaBagian: { select: { id: true, nama: true } }, _count: { select: { employees: true } } }, orderBy: { nama: "asc" } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat data" });
  }
});

// POST /
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.section.create({ data: { nama: req.body.nama, kepalaBagianId: req.body.kepalaBagianId || null } });
    res.status(201).json(item);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Data sudah ada (duplikat)" });
    res.status(500).json({ error: "Gagal membuat data" });
  }
});

// PUT /:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.section.update({ where: { id: String(req.params.id) }, data: { nama: req.body.nama, kepalaBagianId: req.body.kepalaBagianId } });
    res.json(item);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Data sudah ada (duplikat)" });
    res.status(500).json({ error: "Gagal mengupdate data" });
  }
});

// DELETE /:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.section.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2003") return res.status(400).json({ error: "Tidak dapat menghapus: data masih digunakan" });
    res.status(500).json({ error: "Gagal menghapus data" });
  }
});

export default router;
