import { useState, useEffect } from "react";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";
import type { HariLibur as HL } from "../../types";
import { Plus, Trash2, X } from "lucide-react";

export default function HariLibur() {
  const [items, setItems] = useState<HL[]>([]);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tanggal: "", keterangan: "" });

  const load = () => {
    setLoading(true);
    api.get("/hari-libur", { params: { tahun } }).then((r) => setItems(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, [tahun]);

  async function handleSave() {
    try { await api.post("/hari-libur", form); setShowModal(false); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }
  async function handleDelete(id: string) {
    if (!confirm("Hapus?")) return;
    try { await api.delete(`/hari-libur/${id}`); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Hari Libur Nasional</h2>
        <button onClick={() => { setForm({ tanggal: "", keterangan: "" }); setShowModal(true); }} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus size={16} /> Tambah</button>
      </div>
      <div className="flex gap-3">
        <select value={tahun} onChange={(e) => setTahun(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
          {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-400">Memuat...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Keterangan</th><th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody>{items.map((h) => (
              <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3">{formatDate(h.tanggal)}</td>
                <td className="px-4 py-3 text-slate-800">{h.keterangan}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(h.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Tambah Hari Libur</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
