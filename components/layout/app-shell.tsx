"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { resolveIcon, type IconName } from "@/lib/icons";

export type { IconName };

export interface NavItem {
  title: string;
  href: string;
  icon?: IconName;
}

export interface UserInfo {
  name: string;
  roleLabel: string;
  initials: string;
}

export interface AppShellProps {
  brand: string;
  user: UserInfo;
  navGroups: { label: string; items: NavItem[] }[];
  children: React.ReactNode;
}

export function AppShell({ brand, user, navGroups, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-heading text-xs font-bold text-white">
            EKSKUL
          </div>
          <span className="font-heading font-bold text-white">{brand}</span>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-secondary/80">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = resolveIcon(item.icon);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {user.name}
              </div>
              <div className="truncate text-xs text-secondary/80">
                {user.roleLabel}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-sidebar-foreground hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-heading text-[10px] font-bold text-white">
            EKSKUL
          </div>
          <span className="font-heading font-bold">{brand}</span>
        </div>
        <div className="flex items-center gap-1">
          <MobileNav navGroups={navGroups} />
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            onClick={handleLogout}
            aria-label="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        <header className="hidden h-16 items-center justify-between border-b bg-background px-6 lg:flex">
          <div className="font-heading text-base font-semibold">
            {currentTitle(pathname, navGroups)}
          </div>
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </header>
        <main className="flex-1 p-4 pt-20 lg:p-6 lg:pt-6">{children}</main>
        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          SMPITDM EKSKUL — Sistem Manajemen Ekstrakurikuler · Created by{" "}
          <span className="font-semibold text-foreground">Pak Aziz Ms</span>
        </footer>
      </div>
    </div>
  );
}

function currentTitle(pathname: string, groups: { items: NavItem[] }[]): string {
  for (const g of groups) {
    for (const item of g.items) {
      if (pathname === item.href) return item.title;
    }
  }
  return "Dashboard";
}

function MobileNav({ navGroups }: { navGroups: AppShellProps["navGroups"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-14 z-50 border-b bg-background p-3 shadow-lg">
            <nav className="scrollbar-hide max-h-[60vh] space-y-4 overflow-y-auto">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="mb-1 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = resolveIcon(item.icon);
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
