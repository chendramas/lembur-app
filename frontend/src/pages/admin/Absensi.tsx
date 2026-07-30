import { useState, useEffect } from "react";
import api from "../../lib/api";
import { formatDate } from "../../lib/utils";
import type { Absensi as Abs, Employee } from "../../types";
import { Plus, Trash2, X } from "lucide-react";

export default function AbsensiPage() {
  const [items, setItems] = useState<Abs[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: "", tanggal: "", jamMasuk: "08:00", jamPulang: "17:00" });

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/absensi"), api.get("/employees")]).then(([a, e]) => {
      setItems(a.data);
      setEmployees(e.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function handleSave() {
    try { await api.post("/absensi", form); setShowModal(false); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }
  async function handleDelete(id: string) {
    if (!confirm("Hapus?")) return;
    try { await api.delete(`/absensi/${id}`); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Data Absensi</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus size={16} /> Tambah</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-400">Memuat...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Karyawan</th><th className="px-4 py-3 font-medium">Jam Masuk</th><th className="px-4 py-3 font-medium">Jam Pulang</th><th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody>{items.slice(0, 50).map((a) => (
              <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3">{formatDate(a.tanggal)}</td>
                <td className="px-4 py-3 text-slate-800">{a.employee?.nama}</td>
                <td className="px-4 py-3">{a.jamMasuk}</td>
                <td className="px-4 py-3">{a.jamPulang}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Tambah Absensi</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Pilih Karyawan</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.nama}</option>)}
              </select>
              <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 mb-1 block">Jam Masuk</label><input type="time" value={form.jamMasuk} onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div><label className="text-xs text-slate-500 mb-1 block">Jam Pulang</label><input type="time" value={form.jamPulang} onChange={(e) => setForm({ ...form, jamPulang: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
