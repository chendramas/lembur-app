import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { formatRupiah, formatDate, formatDateTime, STATUS_LABELS, STATUS_COLORS } from "../../lib/utils";
import api from "../../lib/api";
import type { SPL } from "../../types";
import { ArrowLeft, Edit, Trash2, Send, CheckCircle, XCircle, Archive } from "lucide-react";

export default function SPLDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isRole } = useAuth();
  const [spl, setSpl] = useState<SPL | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get(`/spl/${id}`).then((res) => setSpl(res.data)).finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action: string, body?: Record<string, string>) {
    setActionLoading(true);
    try {
      await api.post(`/spl/${id}/${action}`, body);
      navigate("/spl");
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus SPL ini?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/spl/${id}`);
      navigate("/spl");
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal menghapus");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="text-slate-400">Memuat...</div>;
  if (!spl) return <div className="text-red-500">SPL tidak ditemukan</div>;

  const canEdit = isRole("SUPERVISOR") && spl.createdById === user?.id && ["DRAFT", "REJECTED_KABAG", "REJECTED_PGA"].includes(spl.status);
  const canSubmit = canEdit && ["DRAFT", "REJECTED_KABAG", "REJECTED_PGA"].includes(spl.status);
  const canApproveKabag = isRole("KABAG") && spl.status === "PENGAJUAN_KABAG";
  const canApprovePga = isRole("PGA") && spl.status === "PENGAJUAN_PGA";
  const canArchive = spl.status === "APPROVED" && !spl.isArchived;

  return (
    <div className="max-w-3xl space-y-6">
      <button onClick={() => navigate("/spl")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Kembali ke daftar
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Detail SPL</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[spl.status]}`}>
          {STATUS_LABELS[spl.status]}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <span className="text-xs text-slate-500">Karyawan</span>
            <p className="text-sm font-medium text-slate-800">{spl.employee?.nama} ({spl.employee?.nip})</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Section</span>
            <p className="text-sm text-slate-800">{spl.section?.nama}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Tanggal</span>
            <p className="text-sm text-slate-800">{formatDate(spl.tanggal)}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Jenis Hari</span>
            <p className="text-sm text-slate-800">{spl.jenisHari === "KERJA" ? "Hari Kerja" : "Hari Libur"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Jam Lembur</span>
            <p className="text-sm text-slate-800">{spl.jamMulai} - {spl.jamSelesai}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Total Jam</span>
            <p className="text-sm font-semibold text-slate-800">{spl.totalJam} jam ({spl.totalMenit} menit)</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Upah Lembur</span>
            <p className="text-lg font-bold text-emerald-600">{formatRupiah(spl.upahLembur)}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Dibuat oleh</span>
            <p className="text-sm text-slate-800">{spl.createdBy?.nama}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">Alasan / Pekerjaan</span>
          <p className="text-sm text-slate-800 mt-1">{spl.alasan}</p>
        </div>
        {spl.catatanRevisi && (
          <div className="mt-3">
            <span className="text-xs text-slate-500">Catatan Justifikasi</span>
            <p className="text-sm text-slate-800 mt-1">{spl.catatanRevisi}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <button onClick={() => navigate(`/spl/${spl.id}/edit`)} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Edit size={14} /> Edit
          </button>
        )}
        {canEdit && (
          <button onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 border border-red-300 rounded-lg text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Hapus
          </button>
        )}
        {canSubmit && (
          <button onClick={() => handleAction("submit")} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
            <Send size={14} /> Submit ke Kabag
          </button>
        )}
        {canApproveKabag && (
          <>
            <button onClick={() => handleAction("approve")} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
              <CheckCircle size={14} /> Setujui
            </button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 px-4 py-2 border border-red-300 rounded-lg text-sm text-red-600 hover:bg-red-50">
              <XCircle size={14} /> Tolak
            </button>
          </>
        )}
        {canApprovePga && (
          <>
            <button onClick={() => handleAction("approve")} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
              <CheckCircle size={14} /> Setujui
            </button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 px-4 py-2 border border-red-300 rounded-lg text-sm text-red-600 hover:bg-red-50">
              <XCircle size={14} /> Tolak
            </button>
          </>
        )}
        {canArchive && (
          <button onClick={() => handleAction("archive")} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Archive size={14} /> Arsipkan
          </button>
        )}
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-4">Tolak SPL</h3>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Alasan penolakan..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { handleAction("reject", { catatan: rejectNote }); setShowReject(false); }} disabled={!rejectNote || actionLoading} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                Tolak
              </button>
              <button onClick={() => setShowReject(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Timeline */}
      {spl.approvalHistory && spl.approvalHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Riwayat Persetujuan</h3>
          <div className="space-y-4">
            {spl.approvalHistory.map((h, i) => (
              <div key={h.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === spl.approvalHistory!.length - 1 ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {i < spl.approvalHistory!.length - 1 && <div className="w-px h-full bg-slate-200" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-slate-800">{STATUS_LABELS[h.dariStatus]} → {STATUS_LABELS[h.keStatus]}</p>
                  <p className="text-xs text-slate-500">{h.olehUser.nama} ({h.olehUser.role})</p>
                  <p className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</p>
                  {h.catatan && <p className="text-sm text-red-600 mt-1">"{h.catatan}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
