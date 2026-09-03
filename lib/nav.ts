import type { UserRole } from "@/db/schema";
import type { NavItem } from "@/components/layout/app-shell";

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminNav: NavGroup[] = [
  {
    label: "Utama",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Pengguna", href: "/admin/users", icon: "Users" },
      { title: "Siswa", href: "/admin/students", icon: "GraduationCap" },
      {
        title: "Ekstrakurikuler",
        href: "/admin/extracurriculars",
        icon: "Trophy",
      },
      { title: "Keanggotaan", href: "/admin/memberships", icon: "UserPlus" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { title: "Pertemuan", href: "/admin/meetings", icon: "CalendarDays" },
      { title: "Absensi", href: "/admin/attendance", icon: "ClipboardCheck" },
    ],
  },
  {
    label: "Pembayaran",
    items: [
      { title: "Pembayaran", href: "/admin/payments", icon: "Wallet" },
    ],
  },
  {
    label: "Laporan",
    items: [
      { title: "Rekap & Laporan", href: "/admin/reports", icon: "BarChart3" },
    ],
  },
];

const pjNav: NavGroup[] = [
  {
    label: "Utama",
    items: [
      { title: "Dashboard", href: "/pj/dashboard", icon: "LayoutDashboard" },
      {
        title: "Pengaturan Ekskul",
        href: "/pj/ekskuls",
        icon: "CreditCard",
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      { title: "Pertemuan", href: "/pj/meetings", icon: "CalendarDays" },
      { title: "Keanggotaan", href: "/pj/memberships", icon: "UserPlus" },
      { title: "Absensi", href: "/pj/attendance", icon: "ClipboardCheck" },
    ],
  },
  {
    label: "Pembayaran",
    items: [{ title: "Pembayaran", href: "/pj/payments", icon: "Wallet" }],
  },
  {
    label: "Laporan",
    items: [{ title: "Rekap & Laporan", href: "/pj/reports", icon: "BarChart3" }],
  },
];

const siswaNav: NavGroup[] = [
  {
    label: "Utama",
    items: [
      { title: "Dashboard", href: "/siswa/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    label: "Saya",
    items: [
      { title: "Absensi Saya", href: "/siswa/attendance", icon: "ClipboardCheck" },
      { title: "Pembayaran Saya", href: "/siswa/payments", icon: "Wallet" },
      { title: "Kuitansi", href: "/siswa/receipts", icon: "Receipt" },
    ],
  },
];

export function getNav(role: UserRole): NavGroup[] {
  switch (role) {
    case "ADMIN":
      return adminNav;
    case "PJ_GURU":
      return pjNav;
    case "SISWA":
      return siswaNav;
    default:
      return siswaNav;
  }
}
