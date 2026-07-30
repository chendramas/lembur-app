import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, FileText, Users, Building2, Calendar, Clock, UserCog, X } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["SUPERVISOR", "KABAG", "PGA", "ADMIN"] },
  { to: "/spl", icon: FileText, label: "SPL", roles: ["SUPERVISOR", "KABAG", "PGA", "ADMIN"] },
  { to: "/admin/employees", icon: Users, label: "Karyawan", roles: ["ADMIN"] },
  { to: "/admin/sections", icon: Building2, label: "Section", roles: ["ADMIN"] },
  { to: "/admin/hari-libur", icon: Calendar, label: "Hari Libur", roles: ["ADMIN"] },
  { to: "/admin/absensi", icon: Clock, label: "Absensi", roles: ["ADMIN"] },
  { to: "/admin/users", icon: UserCog, label: "Pengguna", roles: ["ADMIN"] },
];

export default function Sidebar({ open, onClose }: Props) {
  const { isRole } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-[#0F172A] text-slate-200 z-50 transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <h1 className="text-lg font-semibold text-white">Lembur App</h1>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navItems.filter((item) => isRole(...item.roles)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-emerald-600/10 text-emerald-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
