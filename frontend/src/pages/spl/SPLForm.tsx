import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { formatRupiah } from "../../lib/utils";
import api from "../../lib/api";
import type { Employee } from "../../types";
import { ArrowLeft } from "lucide-react";

export default function SPLForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jenisHari, setJenisHari] = useState<"KERJA" | "LIBUR">("KERJA");
  const [jamMulai, setJamMulai] = useState("17:00");
  const [jamSelesai, setJamSelesai] = useState("20:00");
  const [alasan, setAlasan] = useState("");
  const [catatanRevisi, setCatatanRevisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  // Preview calculation
  const [preview, setPreview] = useState<{ totalJam: number; upahLembur: number } | null>(null);

  useEffect(() => {
    api.get("/employees").then((res) => {
      const filtered = user?.sectionId ? res.data.filter((e: Employee) => e.sectionId === user.sectionId) : res.data;
      setEmployees(filtered);
    });
  }, [user]);

  useEffect(() => {
    if (!employeeId || !jamMulai || !jamSelesai) return;
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const [sh, sm] = jamMulai.split(":").map(Number);
    const [eh, em] = jamSelesai.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 1440;
    const rounded = Math.ceil(mins / 30) * 30;
    const totalJam = rounded / 60;

    const upahPerJam = Math.floor(emp.gajiPokok / 173);
    let total = 0;
    for (let i = 1; i <= totalJam; i++) {
      let mult = 1.5;
      if (jenisHari === "KERJA") { mult = i === 1 ? 1.5 : 2; }
      else { mult = i <= 7 ? 2 : i === 8 ? 3 : 4; }
      total += Math.floor(upahPerJam * mult);
    }
    setPreview({ totalJam, upahLembur: total });

    setWarnings([]);
 }, [employeeId, jamMulai, jamSelesai, jenisHari, employees]);

  // Auto-detect jenis hari
  useEffect(() => {
    if (!tanggal || !employeeId) return;
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const date = new Date(tanggal);
    const day = date.getDay();
    if (emp.jenisMingguKerja === "LIMA_HARI" && (day === 0 || day === 6)) setJenisHari("LIBUR");
    else if (emp.jenisMingguKerja === "ENAM_HARI" && day === 0) setJenisHari("LIBUR");
    else {
      api.get("/spl/holiday-check", { params: { tanggal, employeeId } }).then((res) => {
        setJenisHari(res.data.jenisHari);
      }).catch(() => {});
    }
  }, [tanggal, employeeId, employees]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = { employeeId, tanggal, jenisHari, jamMulai, jamSelesai, alasan, catatanRevisi: catatanRevisi || undefined };
      if (isEdit) {
        await api.put(`/spl/${id}`, data);
      } else {
        await api.post("/spl", data);
      }
      navigate("/spl");
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menyimpan SPL");
      if (err.response?.data?.warnings) setWarnings(err.response.data.warnings);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate("/spl")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={16} /> Kembali
      </button>
      <h2 className="text-xl font-semibold text-slate-900 mb-6">{isEdit ? "Edit SPL" : "Buat SPL Baru"}</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Karyawan</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required>
            <option value="">Pilih karyawan</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.nama} ({e.nip})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Hari</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" value="KERJA" checked={jenisHari === "KERJA"} onChange={() => setJenisHari("KERJA")} /> Hari Kerja
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" value="LIBUR" checked={jenisHari === "LIBUR"} onChange={() => setJenisHari("LIBUR")} /> Hari Libur
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
            <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
            <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
          </div>
        </div>

        {preview && (
          <div className="bg-slate-50 rounded-lg p-4 flex gap-8">
            <div>
              <span className="text-xs text-slate-500">Total Jam</span>
              <p className="text-lg font-semibold text-slate-800">{preview.totalJam} jam</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Estimasi Upah</span>
              <p className="text-lg font-semibold text-emerald-600">{formatRupiah(preview.upahLembur)}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Alasan / Pekerjaan</label>
          <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Draft"}
          </button>
          <button type="button" onClick={() => navigate("/spl")} className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
