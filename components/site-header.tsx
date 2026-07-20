"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { useStore } from "@/components/store-provider";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/kargo-takip", label: "Kargo Takip" },
  { href: "/sepet", label: "Sepet" },
  { href: "/hesap", label: "Hesabım" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { cartCount, user } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRootRef = useRef<HTMLElement | null>(null);
  const isAuthPage = pathname === "/hesap/giris" || pathname === "/hesap/kayit" || pathname === "/admin/giris";
  const nextParam = useMemo(() => encodeURIComponent(pathname || "/"), [pathname]);
  const loginHref = `/hesap/giris?next=${nextParam}`;
  const registerHref = `/hesap/kayit?next=${nextParam}`;
  const navLinks = user?.isAdmin
    ? [...links, { href: "/admin", label: "Admin" }]
    : links;

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const root = headerRootRef.current;
      const target = event.target as Node | null;
      if (!root || !target) {
        return;
      }

      if (!root.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="site-header" ref={headerRootRef}>
      <div className="top-note-marquee" aria-label="Geliştirme duyurusu">
        <p className="top-note-static">SİTE HALA GELİŞTİRİLME AŞAMASINDADIR</p>
      </div>
      <div className="header-main mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
        <div className="flex items-center">
          <Logo />
        </div>

        <button
          type="button"
          className={`menu-toggle mobile-only-toggle ml-auto ${mobileMenuOpen ? "menu-toggle-open" : ""}`}
          aria-controls="main-navigation"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span className="menu-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav
          className={`header-nav order-3 w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-2 backdrop-blur lg:order-2 lg:flex lg:w-auto ${mobileMenuOpen ? "header-nav-open" : ""}`}
          aria-label="Ana navigasyon"
          id="main-navigation"
        >
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`menu-chip ${active ? "menu-chip-active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
                {item.href === "/sepet" ? ` (${cartCount})` : ""}
              </Link>
            );
          })}
          {!user && !isAuthPage ? (
            <div className="auth-nav-links">
              <Link href={loginHref} className="menu-chip" onClick={() => setMobileMenuOpen(false)}>
                Giris Yap
              </Link>
              <Link href={registerHref} className="menu-chip menu-chip-active" onClick={() => setMobileMenuOpen(false)}>
                Kayit Ol
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="order-2 flex flex-wrap items-center justify-end gap-2 lg:order-3">
          <div className="role-badge">
            <small className="text-white/70">Aktif Profil</small>
            <span>{user ? user.name : "Misafir"}</span>
            <strong>{user ? user.role.toUpperCase() : "OTURUM YOK"}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
