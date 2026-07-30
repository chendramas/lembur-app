import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react";
import api from "../lib/api";
import type { Notification } from "../types";

interface Props { onMenuClick: () => void; }

export default function Topbar({ onMenuClick }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.isRead).length;

  useEffect(() => {
    api.get("/notifications").then((res) => setNotifs(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: string, splId?: string | null) {
    await api.post(`/notifications/${id}/read`);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (splId) navigate(`/spl/${splId}`);
    setShowNotifs(false);
  }

  const roleLabel: Record<string, string> = { SUPERVISOR: "Supervisor", KABAG: "Kepala Bagian", PGA: "PGA", ADMIN: "Administrator" };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
      <button onClick={onMenuClick} className="lg:hidden text-slate-600 hover:text-slate-900"><Menu size={22} /></button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative text-slate-500 hover:text-slate-700">
            <Bell size={20} />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-auto">
              <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm">Notifikasi</div>
              {notifs.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400 text-center">Tidak ada notifikasi</div>
              ) : (
                notifs.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id, n.splId)}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-slate-50 hover:bg-slate-50 ${!n.isRead ? "bg-emerald-50" : ""}`}
                  >
                    <p className="text-slate-800">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div ref={menuRef} className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-xs">{user?.nama?.charAt(0)}</div>
            <div className="hidden md:block text-left">
              <div className="font-medium text-slate-800">{user?.nama}</div>
              <div className="text-xs text-slate-400">{roleLabel[user?.role || ""]}</div>
            </div>
            <ChevronDown size={14} className="hidden md:block" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200">
              <button onClick={() => { logout(); navigate("/login"); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
