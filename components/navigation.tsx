"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight, Menu, X, Globe2, ChevronDown } from "lucide-react";
const legacy = "https://www.americantranslationservice.com";
const links = [
  { label: "Our services", href: "#services" },
  { label: "How it works", href: "#process" },
  { label: "About AET", href: legacy + "/e-aboutus.php" },
];
export function Navigation() {
  const menu = useRef<HTMLDetailsElement>(null);
  const language = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => {
    if (!menu.current?.open) return;
    menu.current.open = false;
    requestAnimationFrame(() => menu.current?.querySelector("summary")?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeMenu();
      if (language.current?.open) {
        language.current.open = false;
        language.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return (
    <header className="header">
      <div className="nav-shell">
        <a href="#" className="brand" aria-label="AET home">
          <Image src="/brand/aet-logo-header.svg" width={520} height={120}
            alt="American Education and Translation Services" loading="eager" />
        </a>
        <nav aria-label="Main navigation" className="nav-links">
          {links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
        </nav>
        <div className="nav-actions">
          <details className="language" ref={language}>
            <summary aria-label="Choose language"><Globe2 size={16} /><span>EN</span><ChevronDown size={12} /></summary>
            <div className="language-options">
              <a href={legacy + "/home-zh.php"} lang="zh">中文</a>
              <a href={legacy + "/home-es.php"} lang="es">Español</a>
            </div>
          </details>
          <a href={legacy + "/e-contact.php"} className="nav-contact">Contact Us <ArrowUpRight size={17} /></a>
          <details className="mobile-menu" ref={menu}>
            <summary className="menu-toggle" aria-label="Main menu"><Menu className="menu-open-icon" /><X className="menu-close-icon" /></summary>
            <nav className="mobile-links" aria-label="Mobile navigation">
              {links.map((link) => <a key={link.label} href={link.href} onClick={closeMenu}>{link.label}<ArrowUpRight size={18} /></a>)}
              <a href={legacy + "/e-contact.php"} onClick={closeMenu}>Contact Us <ArrowUpRight size={18} /></a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
export function RevealObserver() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    items.forEach((item) => {
      if (item.getBoundingClientRect().top > window.innerHeight) {
        item.classList.add("will-reveal");
        observer.observe(item);
      }
    });
    return () => {
      observer.disconnect();
      items.forEach((i) => i.classList.remove("will-reveal"));
    };
  }, []);
  return null;
}
