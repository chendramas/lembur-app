import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { formatRupiah, formatDate, STATUS_LABELS, STATUS_COLORS } from "../../lib/utils";
import api from "../../lib/api";
import type { SPL } from "../../types";
import { Plus, Eye } from "lucide-react";

export default function SPLList() {
  const { isRole } = useAuth();
  const navigate = useNavigate();
  const [spls, setSpls] = useState<SPL[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (bulan) params.bulan = bulan;
    if (tahun) params.tahun = tahun;
    api.get("/spl", { params }).then((res) => setSpls(res.data)).finally(() => setLoading(false));
  }, [statusFilter, bulan, tahun]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Daftar SPL</h2>
        {isRole("SUPERVISOR") && (
          <Link to="/spl/new" className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Plus size={16} /> Buat SPL
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleDateString("id-ID", { month: "long" })}</option>
            ))}
          </select>
          <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat...</div>
        ) : spls.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Tidak ada SPL ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Karyawan</th>
                  <th className="px-4 py-3 font-medium">Section</th>
                  <th className="px-4 py-3 font-medium">Jam</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Upah</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {spls.map((spl) => (
                  <tr key={spl.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">{formatDate(spl.tanggal)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{spl.employee?.nama}</td>
                    <td className="px-4 py-3 text-slate-500">{spl.section?.nama}</td>
                    <td className="px-4 py-3 text-slate-600">{spl.jamMulai} - {spl.jamSelesai}</td>
                    <td className="px-4 py-3">{spl.totalJam} jam</td>
                    <td className="px-4 py-3 font-medium">{formatRupiah(spl.upahLembur)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[spl.status]}`}>
                        {STATUS_LABELS[spl.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/spl/${spl.id}`)} className="text-emerald-600 hover:text-emerald-700">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
