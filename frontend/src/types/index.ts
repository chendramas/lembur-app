export interface User {
  id: string;
  nama: string;
  role: "SUPERVISOR" | "KABAG" | "PGA" | "ADMIN";
  sectionId: string | null;
  section?: { id: string; nama: string } | null;
}

export interface Section {
  id: string;
  nama: string;
  kepalaBagianId?: string | null;
  kepalaBagian?: { id: string; nama: string } | null;
  _count?: { employees: number };
}

export interface Employee {
  id: string;
  nama: string;
  nip: string;
  sectionId: string;
  section?: { id: string; nama: string };
  gajiPokok: number;
  jenisMingguKerja: "LIMA_HARI" | "ENAM_HARI";
}

export type SPLStatus = "DRAFT" | "PENGAJUAN_KABAG" | "PENGAJUAN_PGA" | "APPROVED" | "REJECTED_KABAG" | "REJECTED_PGA";

export interface SPL {
  id: string;
  employeeId: string;
  employee: { id: string; nama: string; nip: string; gajiPokok?: number };
  tanggal: string;
  jenisHari: "KERJA" | "LIBUR";
  jamMulai: string;
  jamSelesai: string;
  totalJam: number;
  totalMenit: number;
  upahLembur: number;
  alasan: string;
  status: SPLStatus;
  sectionId: string;
  section?: { id: string; nama: string };
  createdById: string;
  createdBy?: { id: string; nama: string };
  catatanRevisi?: string | null;
  isArchived: boolean;
  approvalHistory?: ApprovalHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  splId: string;
  dariStatus: SPLStatus;
  keStatus: SPLStatus;
  olehUserId: string;
  olehUser: { id: string; nama: string; role: string };
  catatan?: string | null;
  createdAt: string;
}

export interface HariLibur {
  id: string;
  tanggal: string;
  keterangan: string;
}

export interface Absensi {
  id: string;
  employeeId: string;
  employee?: { id: string; nama: string; nip: string };
  tanggal: string;
  jamMasuk: string;
  jamPulang: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  splId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalPerStatus: Record<string, number>;
  totalBiayaPerSection: Array<{ sectionId: string; sectionNama: string; totalBiaya: number; jumlahSPL: number }>;
  weeklyWarnings: Array<{ employeeId: string; employeeNama: string; totalJam: number; exceeded: boolean }>;
}
