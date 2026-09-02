import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "./session";

/**
 * Server-side auth guard. Use in Server Components/layouts.
 * Returns the session payload or redirects to login.
 */
export async function requireSession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    redirect("/");
  }
  return session;
}

/**
 * Require a specific role. Returns the session or redirects.
 */
export async function requireRole(roles: UserRole[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect("/");
  }
  return session;
}
