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
  CreditCard,
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
  | "CheckCircle2"
  | "CreditCard";

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
  CreditCard,
};

export function resolveIcon(name?: IconName): LucideIcon {
  return name ? iconMap[name] : LayoutDashboard;
}
