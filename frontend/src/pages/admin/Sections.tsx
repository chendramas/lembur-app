import { useState, useEffect } from "react";
import api from "../../lib/api";
import type { Section, User } from "../../types";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function Sections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Section | null>(null);
  const [form, setForm] = useState({ nama: "", kepalaBagianId: "" });

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/sections"), api.get("/users")]).then(([s, u]) => {
      setSections(s.data);
      setUsers(u.data.filter((u: User) => u.role === "KABAG"));
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openCreate() { setEditItem(null); setForm({ nama: "", kepalaBagianId: "" }); setShowModal(true); }
  function openEdit(s: Section) { setEditItem(s); setForm({ nama: s.nama, kepalaBagianId: s.kepalaBagianId || "" }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editItem) await api.put(`/sections/${editItem.id}`, form);
      else await api.post("/sections", form);
      setShowModal(false);
      load();
    } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus section ini?")) return;
    try { await api.delete(`/sections/${id}`); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Data Section</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus size={16} /> Tambah</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-400">Memuat...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">Kepala Bagian</th><th className="px-4 py-3 font-medium">Karyawan</th><th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody>{sections.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{s.nama}</td>
                <td className="px-4 py-3 text-slate-600">{s.kepalaBagian?.nama || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{s._count?.employees || 0}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{editItem ? "Edit" : "Tambah"} Section</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Section" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={form.kepalaBagianId} onChange={(e) => setForm({ ...form, kepalaBagianId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Pilih Kepala Bagian</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.nama}</option>)}
              </select>
              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
