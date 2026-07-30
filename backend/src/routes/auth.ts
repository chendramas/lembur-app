import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Username atau password salah" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Username atau password salah" });

    const token = jwt.sign(
      { id: user.id, role: user.role, sectionId: user.sectionId, nama: user.nama },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user.id, nama: user.nama, role: user.role, sectionId: user.sectionId },
    });
  } catch (err) {
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { section: { select: { id: true, nama: true } } },
    });
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    res.json({
      id: user.id,
      nama: user.nama,
      role: user.role,
      sectionId: user.sectionId,
      sectionNama: user.section?.nama || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

export default router;
