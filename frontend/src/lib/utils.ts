export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENGAJUAN_KABAG: "Menunggu Kabag",
  PENGAJUAN_PGA: "Menunggu PGA",
  APPROVED: "Disetujui",
  REJECTED_KABAG: "Ditolak Kabag",
  REJECTED_PGA: "Ditolak PGA",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENGAJUAN_KABAG: "bg-yellow-100 text-yellow-700",
  PENGAJUAN_PGA: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED_KABAG: "bg-red-100 text-red-700",
  REJECTED_PGA: "bg-red-100 text-red-700",
};
