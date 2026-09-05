import { AppShell } from "@/components/layout/app-shell";
import { getNav } from "@/lib/nav";
import { getCurrentUser, initialsOf } from "@/lib/auth/current-user";
import { getStudentForUser } from "@/lib/auth/student-resolver";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const student = await getStudentForUser(user.id);

  return (
    <AppShell
      brand="EKSKULKU"
      homeHref="/siswa/dashboard"
      user={{
        name: user.name,
        roleLabel: user.roleLabel,
        initials: initialsOf(user.name),
      }}
      navGroups={getNav("SISWA")}
    >
      {student ? (
        children
      ) : (
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Profil belum tersedia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Akun ini belum terhubung ke profil siswa. Hubungi admin sekolah
                untuk menautkan data NIS Anda.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
