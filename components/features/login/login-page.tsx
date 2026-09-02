"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarCheck,
  FileBarChart,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const demoRoles = [
  { label: "Admin", email: "admin@example.com", role: "ADMIN" },
  { label: "PJ/Guru", email: "guru1@example.com", role: "PJ_GURU" },
  { label: "Siswa", email: "siswa1@example.com", role: "SISWA" },
];

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Masukkan email dan kata sandi yang valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal.");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  function fillDemo(r: (typeof demoRoles)[number]) {
    setEmail(r.email);
    setPassword("password123");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-primary via-primary to-secondary p-12 text-white lg:flex">
        <div className="max-w-md">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 font-heading text-xl font-bold">
            EKS
          </div>
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Sistem Manajemen
            <br />
            Ekstrakurikuler Sekolah
          </h1>
          <p className="mt-4 text-lg opacity-95">
            Kelola kegiatan, absensi, rekap, dan pembayaran secara terpusat
            untuk Admin, PJ/Guru, dan Siswa.
          </p>

          <div className="mt-10 space-y-4">
            <Feature icon={CalendarCheck} title="Absensi pertemuan dengan anti-duplikasi" />
            <Feature icon={FileBarChart} title="Rekap mingguan & bulanan dengan export" />
            <Feature icon={CreditCard} title="Pembayaran ekskul & verifikasi Admin/PJ" />
            <Feature icon={ShieldCheck} title="Kontrol akses ketat berbasis peran (RBAC)" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[440px] lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary font-heading font-bold text-white">
              EKS
            </div>
          </div>

          <h2 className="font-heading text-2xl font-semibold">Masuk ke akun Anda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Silakan masuk dengan akun yang telah terdaftar.
          </p>

          {/* Demo role picker */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {demoRoles.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => fillDemo(r)}
                className="rounded-md border px-2 py-2 text-center transition-colors hover:border-ring hover:bg-primary/5"
              >
                <div className="text-xs font-semibold text-foreground">
                  {r.label}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {r.email}
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
            SMPITDM EKS — Sistem Manajemen Ekstrakurikuler · Created by{" "}
            <span className="font-semibold text-foreground">Pak Aziz Ms</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0" />
      <span>{title}</span>
    </div>
  );
}
