import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.isActive !== 1) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }

    const token = createSessionToken(user.id, user.email, user.role);
    const redirectTo =
      user.role === "ADMIN"
        ? "/admin/dashboard"
        : user.role === "PJ_GURU"
          ? "/pj/dashboard"
          : "/siswa/dashboard";

    const response = NextResponse.json({ redirectTo });
    const maxAge = 60 * 60 * 8;
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
