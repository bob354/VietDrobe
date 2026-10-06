"use client";

import { BrandMark } from "@/components/brand-mark";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const items = [
  { href: "/catalog", label: "Tủ đồ" },
  { href: "/suggest", label: "Phối đồ" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return <header className="site-header">
    <div className="site-header-inner shell">
      <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="VietDrobe, trang chủ"><BrandMark className="brand-mark" /><span className="brand-name">VietDrobe<small>TRANG PHỤC VIỆT</small></span></Link>
      <nav className="desktop-nav" aria-label="Điều hướng chính">{items.map(item => <Link href={item.href} key={item.href} className={pathname.startsWith(item.href) ? "active" : ""}>{item.label}</Link>)}</nav>
      <div className="header-actions"><ThemeToggle /><Link className="header-rent" href="/rent">Giỏ thuê <ArrowUpRight size={15} aria-hidden="true" /></Link><button className="menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Đóng menu" : "Mở menu"}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div>
    <nav id="mobile-navigation" className={`mobile-nav ${open ? "is-open" : ""}`} aria-label="Điều hướng di động">{items.map(item => <Link href={item.href} key={item.href} onClick={() => setOpen(false)} className={pathname.startsWith(item.href) ? "active" : ""}>{item.label}<ArrowUpRight size={17} aria-hidden="true" /></Link>)}</nav>
  </header>;
}
