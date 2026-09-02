import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  UserPlus,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  BarChart3,
  Receipt,
  ShieldCheck,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconName =
  | "LayoutDashboard"
  | "Users"
  | "GraduationCap"
  | "Trophy"
  | "UserPlus"
  | "CalendarDays"
  | "ClipboardCheck"
  | "Wallet"
  | "BarChart3"
  | "Receipt"
  | "ShieldCheck"
  | "CalendarCheck"
  | "CheckCircle2";

const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  Trophy,
  UserPlus,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  BarChart3,
  Receipt,
  ShieldCheck,
  CalendarCheck,
  CheckCircle2,
};

export function resolveIcon(name?: IconName): LucideIcon {
  return name ? iconMap[name] : LayoutDashboard;
}
