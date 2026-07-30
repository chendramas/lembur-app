import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import splRoutes from "./routes/spl";
import dashboardRoutes from "./routes/dashboard";
import employeeRoutes from "./routes/employees";
import sectionRoutes from "./routes/sections";
import hariLiburRoutes from "./routes/hari-libur";
import absensiRoutes from "./routes/absensi";
import userRoutes from "./routes/users";
import notificationRoutes from "./routes/notifications";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = process.env.FRONTEND_URL || "http://localhost:5173";
    if (origin === allowed || origin.endsWith(".vercel.app")) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/spl", splRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/hari-libur", hariLiburRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Terjadi kesalahan server" });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
