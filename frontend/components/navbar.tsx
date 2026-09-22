"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/catalog", label: "Tủ Đồ Di Sản" },
    { href: "/suggest", label: "AI Stylist" },
    { href: "/studio", label: "Your Studio" },
    { href: "/rent", label: "Đặt Thuê" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7DFD3] dark:border-[#2E2A26] bg-[#F9F6F0]/90 dark:bg-[#121110]/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 h-18">
        {/* Brand with small seal stamp */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="seal-stamp w-8 h-8 rounded-sm text-sm font-serif font-bold">
            越
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-medium text-lg tracking-widest text-[#1C1917] dark:text-[#EAE5DC]">
              VIỆT PHỤC <span className="text-[#9E2A2B] dark:text-[#D94142]">REMIX</span>
            </span>
            <span className="text-[10px] tracking-wider text-[#78716C] dark:text-[#A8A29E] uppercase font-light">
              Di sản cổ truyền • Hơi thở đương đại
            </span>
          </div>
        </Link>

        {/* Minimal Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-xs uppercase tracking-widest transition-all py-1 relative",
                  isActive
                    ? "text-[#1C1917] dark:text-[#EAE5DC] font-semibold"
                    : "text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EAE5DC]"
                )}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#9E2A2B] dark:bg-[#D94142]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Clean right actions */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
