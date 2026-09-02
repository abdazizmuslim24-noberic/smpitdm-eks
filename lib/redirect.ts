export function roleHome(role: "ADMIN" | "PJ_GURU" | "SISWA"): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "PJ_GURU") return "/pj/dashboard";
  return "/siswa/dashboard";
}
