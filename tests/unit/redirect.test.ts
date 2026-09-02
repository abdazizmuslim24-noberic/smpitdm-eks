import { describe, it, expect } from "vitest";
import { roleHome } from "@/lib/redirect";

describe("roleHome", () => {
  it("routes ADMIN to the admin dashboard", () => {
    expect(roleHome("ADMIN")).toBe("/admin/dashboard");
  });

  it("routes PJ_GURU to the PJ dashboard", () => {
    expect(roleHome("PJ_GURU")).toBe("/pj/dashboard");
  });

  it("routes SISWA to the siswa dashboard", () => {
    expect(roleHome("SISWA")).toBe("/siswa/dashboard");
  });
});
