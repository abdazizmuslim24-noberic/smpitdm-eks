import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });

  it("resolves tailwind-merge conflicts (later wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });
});
