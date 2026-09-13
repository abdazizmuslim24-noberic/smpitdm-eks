"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cycles light -> dark -> system.
 * Rendered as a compact icon button; adapts to sidebar (light text) vs
 * app topbars via the `className` and `light` props.
 */
export function ThemeToggle({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const colorClass = light
    ? "text-white/80 hover:bg-white/10 hover:text-white"
    : "text-muted-foreground hover:bg-muted hover:text-foreground";

  const label =
    theme === "dark" ? "Ganti ke terang" : theme === "light" ? "Ganti ke gelap" : "Ganti tema";

  return (
    <button
      type="button"
      aria-label={mounted ? label : "Ganti tema"}
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
      className={cn("rounded-md p-1.5 transition-colors", colorClass, className)}
    >
      {!mounted ? (
        <SunMoon className="h-5 w-5" />
      ) : resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}