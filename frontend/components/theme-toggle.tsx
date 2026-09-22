"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xs border border-[#E7DFD3] dark:border-[#2E2A26]" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "light" ? "Chuyển sang chế độ Sơn Mài (Tối)" : "Chuyển sang chế độ Bạch Ngọc (Sáng)"}
      aria-label="Chuyển đổi giao diện sáng/tối"
      className="relative flex items-center justify-center w-8 h-8 border border-[#E7DFD3] dark:border-[#2E2A26] bg-white/60 dark:bg-[#1C1A18]/80 text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EAE5DC] hover:border-[#1C1917] dark:hover:border-[#EAE5DC] transition-all duration-300 group"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 stroke-[1.5] transition-transform duration-300 group-hover:-rotate-12" />
      ) : (
        <Sun className="w-4 h-4 stroke-[1.5] text-[#C5A880] transition-transform duration-300 group-hover:rotate-45" />
      )}
    </button>
  );
}
