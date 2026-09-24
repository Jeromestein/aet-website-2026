"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Menu, X, Globe2, ChevronDown } from "lucide-react";
const legacy = "https://www.americantranslationservice.com";
const links = [
  { label: "Our services", href: "#services" },
  { label: "How it works", href: "#process" },
  { label: "About AET", href: legacy + "/e-aboutus.php" },
];
export function Navigation() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
    }
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return (
    <header className="header" ref={ref}>
      <div className="nav-shell">
        <a href="#" className="brand" aria-label="AET home">
          <Image
            src="/brand/aet-logo-header.svg"
            width={520}
            height={120}
            alt="American Education and Translation Services"
            priority
          />
        </a>
        <nav
          aria-label="Main navigation"
          className={open ? "nav-links is-open" : "nav-links"}
          id="main-navigation"
        >
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a className="mobile-contact" href={legacy + "/e-contact.php"}>
            Contact us <ArrowUpRight size={16} />
          </a>
        </nav>
        <div className="nav-actions">
          <details className="language">
            <summary aria-label="Choose language">
              <Globe2 size={16} />
              <span>EN</span>
              <ChevronDown size={12} />
            </summary>
            <div className="language-options">
              <a href={legacy + "/home-zh.php"} lang="zh">
                中文
              </a>
              <a href={legacy + "/home-es.php"} lang="es">
                Español
              </a>
            </div>
          </details>
          <a href={legacy + "/e-contact.php"} className="nav-contact">
            Let’s talk <ArrowUpRight size={17} />
          </a>
          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
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
