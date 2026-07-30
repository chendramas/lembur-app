import { Router, Response } from "express";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET / — semua role bisa lihat (untuk dropdown SPL)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.employee.findMany({ include: { section: { select: { id: true, nama: true } } }, orderBy: { nama: "asc" } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat data" });
  }
});

// POST / — admin only
router.post("/", authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.employee.create({ data: { nama: req.body.nama, nip: req.body.nip, sectionId: req.body.sectionId, gajiPokok: parseInt(req.body.gajiPokok), jenisMingguKerja: req.body.jenisMingguKerja || "LIMA_HARI" } });
    res.status(201).json(item);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Data sudah ada (duplikat)" });
    res.status(500).json({ error: "Gagal membuat data" });
  }
});

// PUT /:id — admin only
router.put("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.employee.update({ where: { id: String(req.params.id) }, data: { nama: req.body.nama, nip: req.body.nip, sectionId: req.body.sectionId, gajiPokok: req.body.gajiPokok ? parseInt(req.body.gajiPokok) : undefined, jenisMingguKerja: req.body.jenisMingguKerja } });
    res.json(item);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Data sudah ada (duplikat)" });
    res.status(500).json({ error: "Gagal mengupdate data" });
  }
});

// DELETE /:id — admin only
router.delete("/:id", authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.employee.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2003") return res.status(400).json({ error: "Tidak dapat menghapus: data masih digunakan" });
    res.status(500).json({ error: "Gagal menghapus data" });
  }
});

export default router;
