import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { formatRupiah } from "../lib/utils";
import api from "../lib/api";
import type { DashboardStats } from "../types";
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const statCards = [
  { key: "DRAFT", label: "Draft", icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
  { key: "PENGAJUAN_KABAG", label: "Menunggu Kabag", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  { key: "PENGAJUAN_PGA", label: "Menunggu PGA", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "APPROVED", label: "Disetujui", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Memuat dashboard...</div>;
  if (!stats) return <div className="text-red-500">Gagal memuat dashboard</div>;

  const totalRejected = (stats.totalPerStatus["REJECTED_KABAG"] || 0) + (stats.totalPerStatus["REJECTED_PGA"] || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Selamat datang, {user?.nama}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.key} className={`${card.bg} rounded-xl border border-slate-200 p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className="text-xs text-slate-500">{card.label}</span>
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{stats.totalPerStatus[card.key] || 0}</div>
          </div>
        ))}
        <div className="bg-red-50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="text-red-600" />
            <span className="text-xs text-slate-500">Ditolak</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Biaya Lembur per Section (Bulan Ini)</h3>
          </div>
          <div className="p-5">
            {stats.totalBiayaPerSection.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {stats.totalBiayaPerSection.map((s) => (
                  <div key={s.sectionId} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-700">{s.sectionNama}</span>
                      <span className="text-xs text-slate-400 ml-2">({s.jumlahSPL} SPL)</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatRupiah(s.totalBiaya)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Peringatan Lembur Mingguan</h3>
          </div>
          <div className="p-5">
            {stats.weeklyWarnings.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada peringatan minggu ini</p>
            ) : (
              <div className="space-y-3">
                {stats.weeklyWarnings.map((w) => (
                  <div key={w.employeeId} className={`flex items-center gap-3 p-3 rounded-lg ${w.exceeded ? "bg-red-50" : "bg-yellow-50"}`}>
                    <AlertTriangle size={16} className={w.exceeded ? "text-red-500" : "text-yellow-500"} />
                    <div>
                      <span className="text-sm font-medium text-slate-800">{w.employeeNama}</span>
                      <span className="text-xs text-slate-500 ml-2">{w.totalJam} jam/minggu</span>
                      {w.exceeded && <span className="text-xs text-red-600 ml-1">(melebihi 18 jam)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
