"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Globe2, ChevronDown } from "lucide-react";
import styles from "./navigation.module.css";

const legacy = "https://www.americantranslationservice.com";
const links = [
  { label: "Home", href: "/" },
  { label: "Evaluation", href: legacy + "/e-evaluation.php" },
  { label: "Services", children: [
    { label: "Certified Translation", href: legacy + "/e-notarized.php" },
    { label: "Technical Translation", href: legacy + "/e-tech-translation.php" },
    { label: "Interpretation", href: legacy + "/e-interpretation.php" },
    { label: "Expert Opinion Letters", href: legacy + "/e-expert-opinion-letter.php" },
    { label: "General Translation", href: legacy + "/e-translation.php" },
    { label: "Notarization", href: legacy + "/e-nus.php" },
  ] },
  { label: "Contact", href: legacy + "/e-contact.php" },
  { label: "Payment", href: legacy + "/e-pay.php" },
  { label: "Blog", href: legacy + "/blog" },
];
const languages = [
  { label: "English", lang: "en", href: "/" },
  { label: "中文", lang: "zh", href: legacy + "/home-zh.php" },
  { label: "Español", lang: "es", href: legacy + "/home-es.php" },
];

export function Navigation() {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = (restoreFocus = true) => {
    if (!menu.current?.open) return;
    menu.current.open = false;
    menu.current.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((item) => { item.open = false; });
    if (restoreFocus) menu.current.querySelector("summary")?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const closeDesktop = () => {
      header.current?.querySelectorAll<HTMLDetailsElement>("details[data-desktop][open]").forEach((item) => { item.open = false; });
    };
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) closeDesktop();
    };
    const onFocus = (event: FocusEvent) => {
      header.current?.querySelectorAll<HTMLDetailsElement>("details[data-desktop][open]").forEach((item) => {
        if (!item.contains(event.target as Node)) item.open = false;
      });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const disclosure = header.current?.querySelector<HTMLDetailsElement>("details[data-desktop][open]");
        if (disclosure) {
          disclosure.open = false;
          disclosure.querySelector("summary")?.focus();
        } else closeMenu();
      }
      if (event.key !== "Tab" || !menu.current?.open) return;
      const controls = Array.from(header.current?.querySelectorAll<HTMLElement>("a[href], summary") ?? [])
        .filter((item) => item.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    const breakpoint = window.matchMedia("(max-width: 1080px)");
    const onResize = () => { closeMenu(false); closeDesktop(); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKey);
    breakpoint.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKey);
      breakpoint.removeEventListener("change", onResize);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    const background = Array.from(document.querySelectorAll<HTMLElement>("main, footer"));
    const previousInert = background.map((item) => item.inert);
    document.body.style.overflow = "hidden";
    background.forEach((item) => { item.inert = true; });
    return () => {
      document.body.style.overflow = overflow;
      background.forEach((item, index) => { item.inert = previousInert[index]; });
    };
  }, [menuOpen]);

  return (
    <header className={styles.header} ref={header}>
      <div className={styles.shell}>
        <a href="/" className={styles.brand} aria-label="AET home" onClick={() => closeMenu(false)}>
          <Image src="/brand/aet-logo-header.svg" width={520} height={120}
            alt="American Education and Translation Services,CORP (AET)" loading="eager" />
        </a>
        <nav aria-label="Main navigation" className={styles.desktop}>
          <ul className={styles.desktopList}>
            {links.map((link) => (
              <li key={link.label}>
                {link.children ? (
                  <details className={styles.dropdown} name="desktop-navigation" data-desktop>
                    <summary className={styles.navLink}>{link.label}<ChevronDown size={14} aria-hidden="true" /></summary>
                    <div className={styles.submenu}>
                      {link.children.map((child) => <a key={child.label} href={child.href}>{child.label}</a>)}
                    </div>
                  </details>
                ) : <a className={styles.navLink} href={link.href} aria-current={link.label === "Home" ? "page" : undefined}>{link.label}</a>}
              </li>
            ))}
          </ul>
        </nav>
        <details className={`${styles.dropdown} ${styles.language}`} name="desktop-navigation" data-desktop>
          <summary aria-label="Choose language"><Globe2 size={18} aria-hidden="true" /><span>EN</span><ChevronDown size={13} aria-hidden="true" /></summary>
          <div className={`${styles.submenu} ${styles.languageOptions}`}>
            {languages.map((item) => <a key={item.lang} href={item.href} lang={item.lang} aria-current={item.lang === "en" ? "page" : undefined}>{item.label}</a>)}
          </div>
        </details>
        <details className={styles.mobileMenu} ref={menu} onToggle={(event) => {
          setMenuOpen(event.currentTarget.open);
          if (!event.currentTarget.open) event.currentTarget.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((item) => { item.open = false; });
        }}>
          <summary className={styles.menuToggle} aria-label="Main menu" aria-controls="mobile-navigation">
            <span /><span />
          </summary>
          <div className={styles.mobilePanel} id="mobile-navigation">
            <nav aria-label="Mobile navigation">
              <ul className={styles.mobileList}>
                {links.map((link, index) => (
                  <li key={link.label}>
                    {link.children ? (
                      <details className={styles.mobileServices}>
                        <summary className={styles.mobileLink}><span className={styles.number} aria-hidden="true">0{index + 1}</span>{link.label}<ChevronDown size={20} aria-hidden="true" /></summary>
                        <div className={styles.mobileSubmenu}>
                          {link.children.map((child) => <a key={child.label} href={child.href} onClick={() => closeMenu()}>{child.label}</a>)}
                        </div>
                      </details>
                    ) : <a className={styles.mobileLink} href={link.href} aria-current={link.label === "Home" ? "page" : undefined} onClick={() => closeMenu()}><span className={styles.number} aria-hidden="true">0{index + 1}</span>{link.label}</a>}
                  </li>
                ))}
              </ul>
            </nav>
            <div className={styles.mobileLanguages} aria-label="Language">
              <span className={styles.languageLabel}><Globe2 size={17} aria-hidden="true" />Language</span>
              <div>{languages.map((item) => <a key={item.lang} href={item.href} lang={item.lang} aria-current={item.lang === "en" ? "page" : undefined} onClick={() => closeMenu()}>{item.label}</a>)}</div>
            </div>
          </div>
        </details>
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
