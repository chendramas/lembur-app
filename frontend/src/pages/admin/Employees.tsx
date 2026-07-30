import { useState, useEffect } from "react";
import api from "../../lib/api";
import { formatRupiah } from "../../lib/utils";
import type { Employee, Section } from "../../types";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [form, setForm] = useState({ nama: "", nip: "", sectionId: "", gajiPokok: "", jenisMingguKerja: "LIMA_HARI" });

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/employees"), api.get("/sections")]).then(([e, s]) => {
      setEmployees(e.data);
      setSections(s.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openCreate() { setEditItem(null); setForm({ nama: "", nip: "", sectionId: "", gajiPokok: "", jenisMingguKerja: "LIMA_HARI" }); setShowModal(true); }
  function openEdit(e: Employee) { setEditItem(e); setForm({ nama: e.nama, nip: e.nip, sectionId: e.sectionId, gajiPokok: String(e.gajiPokok), jenisMingguKerja: e.jenisMingguKerja }); setShowModal(true); }

  async function handleSave() {
    try {
      if (editItem) await api.put(`/employees/${editItem.id}`, form);
      else await api.post("/employees", form);
      setShowModal(false);
      load();
    } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus karyawan ini?")) return;
    try { await api.delete(`/employees/${id}`); load(); } catch (err: any) { alert(err.response?.data?.error || "Gagal"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Data Karyawan</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"><Plus size={16} /> Tambah</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-400">Memuat...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Nama</th><th className="px-4 py-3 font-medium">NIP</th><th className="px-4 py-3 font-medium">Section</th><th className="px-4 py-3 font-medium">Gaji Pokok</th><th className="px-4 py-3 font-medium">Minggu Kerja</th><th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody>{employees.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{e.nama}</td>
                <td className="px-4 py-3 text-slate-600">{e.nip}</td>
                <td className="px-4 py-3 text-slate-600">{e.section?.nama}</td>
                <td className="px-4 py-3">{formatRupiah(e.gajiPokok)}</td>
                <td className="px-4 py-3">{e.jenisMingguKerja === "LIMA_HARI" ? "5 Hari" : "6 Hari"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(e)} className="text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
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
              <h3 className="font-semibold text-slate-900">{editItem ? "Edit" : "Tambah"} Karyawan</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="NIP" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">Pilih Section</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
              <input type="number" value={form.gajiPokok} onChange={(e) => setForm({ ...form, gajiPokok: e.target.value })} placeholder="Gaji Pokok (Rp)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <select value={form.jenisMingguKerja} onChange={(e) => setForm({ ...form, jenisMingguKerja: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="LIMA_HARI">5 Hari/Minggu</option>
                <option value="ENAM_HARI">6 Hari/Minggu</option>
              </select>
              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
