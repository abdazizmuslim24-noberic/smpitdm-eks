import { AppShell } from "@/components/layout/app-shell";
import { getNav } from "@/lib/nav";
import { getCurrentUser, initialsOf } from "@/lib/auth/current-user";

export default async function PjLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <AppShell
      brand="EKSKULKU"
      homeHref="/pj/dashboard"
      user={{
        name: user.name,
        roleLabel: user.roleLabel,
        initials: initialsOf(user.name),
      }}
      navGroups={getNav("PJ_GURU")}
    >
      {children}
    </AppShell>
  );
}
