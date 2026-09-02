import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { LoginPage } from "@/components/features/login/login-page";
import { roleHome } from "@/lib/redirect";

export const metadata = {
  title: "Masuk",
};

/**
 * Root page: if already signed in, redirect to the role dashboard.
 * Otherwise show the login screen.
 */
export default async function Page() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (session) {
    redirect(roleHome(session.role));
  }

  return <LoginPage />;
}
