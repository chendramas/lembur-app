import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nama: true, username: true, role: true, sectionId: true, section: { select: { id: true, nama: true } }, createdAt: true },
      orderBy: { nama: "asc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Gagal memuat data pengguna" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { nama, username, password, role, sectionId } = req.body;
    if (!nama || !username || !password || !role) {
      return res.status(400).json({ error: "Nama, username, password, dan role wajib diisi" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nama, username, passwordHash, role, sectionId: sectionId || null },
      select: { id: true, nama: true, username: true, role: true, sectionId: true },
    });
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(400).json({ error: "Username sudah digunakan" });
    res.status(500).json({ error: "Gagal membuat pengguna" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const data: any = {};
    if (req.body.nama) data.nama = req.body.nama;
    if (req.body.role) data.role = req.body.role;
    if (req.body.sectionId !== undefined) data.sectionId = req.body.sectionId || null;
    if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data,
      select: { id: true, nama: true, username: true, role: true, sectionId: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengupdate pengguna" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2003") return res.status(400).json({ error: "Tidak dapat menghapus: pengguna masih memiliki data terkait" });
    res.status(500).json({ error: "Gagal menghapus pengguna" });
  }
});

export default router;
