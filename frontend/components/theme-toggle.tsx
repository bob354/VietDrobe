"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

const subscribe = (notify: () => void) => {
  window.addEventListener("vietdrobe-theme", notify);
  return () => window.removeEventListener("vietdrobe-theme", notify);
};
const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    window.dispatchEvent(new Event("vietdrobe-theme"));
  };
  return <button type="button" onClick={toggle} title={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} aria-label="Chuyển đổi giao diện sáng/tối" className="relative flex items-center justify-center w-8 h-8 border border-[#D8D0C1] dark:border-[#485047] bg-white/60 dark:bg-[#232923]/80 text-[#625F56] dark:text-[#B7AFA0] hover:text-[#24251F] dark:hover:text-[#EEE8DC] transition-colors">{dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}</button>;
}
