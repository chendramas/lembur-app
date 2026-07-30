import { useState, useEffect } from "react";
import api from "../../lib/api";
import type { User, Section } from "../../types";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [form, setForm] = useState({ nama: "", username: "", password: "", role: "SUPERVISOR", sectionId: "" });

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/users"), api.get("/sections")]).then(([u, s]) => {
      setUsers(u.data);
      setSections(s.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openCreate() { setEditItem(null); setForm({ nama: "", username: "", password: "", role: "SUPERVISOR", sectionId: "" }); setShowModal(true); }
  function openEdit(u: User) { setEditItem(u); setForm({ nama: u.nama, username: (u as any).username || "", password: "", role: u.role, sectionId: u.sectionId || "" }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editItem) { const { password, ...rest } = form; await api.put(`/users/${editItem.id}`, password ? form : rest); }
      else await api.post("/users", form);
      setShowModal(false);
      load();
    } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengguna ini?")) return;
    try { await api.delete(`/users/${id}`); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  const roleLabel: Record<string, string> = { SUPERVISOR: "Supervisor", KABAG: "Kepala Bagian", PGA: "PGA", ADMIN: "Admin" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Data Pengguna</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus size={16} /> Tambah</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-400">Memuat...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">Username</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Section</th><th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nama}</td>
                <td className="px-4 py-3 text-slate-600">{(u as any).username}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">{roleLabel[u.role]}</span></td>
                <td className="px-4 py-3 text-slate-600">{u.section?.nama || "-"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
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
              <h3 className="font-semibold text-slate-900">{editItem ? "Edit" : "Tambah"} Pengguna</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" disabled={!!editItem} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editItem ? "Kosongkan jika tidak diubah" : "Password"} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="SUPERVISOR">Supervisor</option><option value="KABAG">Kepala Bagian</option><option value="PGA">PGA</option><option value="ADMIN">Admin</option>
              </select>
              {["SUPERVISOR", "KABAG"].includes(form.role) && (
                <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Pilih Section</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              )}
              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
