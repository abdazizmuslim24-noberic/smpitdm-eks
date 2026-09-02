import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "./guard";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PJ_GURU" | "SISWA";
  roleLabel: string;
}

const roleLabels: Record<CurrentUser["role"], string> = {
  ADMIN: "Administrator",
  PJ_GURU: "PJ / Guru",
  SISWA: "Siswa",
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await requireSession();
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  return {
    ...user,
    roleLabel: roleLabels[user.role],
  };
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
