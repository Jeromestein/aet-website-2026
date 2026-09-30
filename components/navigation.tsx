"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Globe2, ChevronDown } from "lucide-react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { contactPath } from '@/lib/contact';
import { LanguageSwitcher, LanguageOptions } from "./language-switcher";
import styles from "./navigation.module.css";

const legacy = "https://www.americantranslationservice.com";
const application = "https://app.americantranslationservice.com/credential-evaluation-application";
export function Navigation() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const home = getPathname({ locale, href: "/" });
  const links = [
    { label: t("navigation.home"), href: home },
    { label: t("navigation.evaluation"), href: getPathname({ locale, href: "/evaluation" }) },
    { label: t("navigation.services"), children: [
      { label: t("navigation.certified"), href: getPathname({ locale, href: "/certified-translation" }) },
      { label: t("navigation.technical"), href: getPathname({ locale, href: "/technical-translation" }) },
      { label: t("navigation.interpretation"), href: getPathname({ locale, href: "/interpretation" }) },
      { label: t("navigation.expert"), href: getPathname({ locale, href: "/expert-opinion-letters" }) },
      { label: t("navigation.general"), href: getPathname({ locale, href: "/general-translation" }) },
      { label: t("navigation.notarization"), href: getPathname({ locale, href: "/notarization" }) },
      { label: t("pricing.title"), href: getPathname({ locale, href: "/pricing" }) },
    ] },
    { label: t("navigation.contact"), href: contactPath(locale) },
    { label: t("navigation.payment"), href: getPathname({ locale, href: "/payment" }) },
    { label: t("navigation.blog"), href: legacy + "/blog" },
  ];

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
    const breakpoint = window.matchMedia("(max-width: 1200px)");
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
        <a href={home} className={styles.brand} aria-label={t("navigation.homeLabel")} onClick={() => closeMenu(false)}>
          <Image src="/brand/aet-logo-header.svg" width={520} height={120}
            alt="American Education and Translation Services,CORP (AET)" loading="eager" />
        </a>
        <nav aria-label={t("navigation.mainLabel")} className={styles.desktop}>
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
                ) : <a className={styles.navLink} href={link.href} aria-current={link.href === home && pathname === "/" ? "page" : undefined}>{link.label}</a>}
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSwitcher onOpen={() => closeMenu(false)} />
        <a className={`${styles.application} ${styles.desktopApplication}`} href={application}>{t("navigation.apply")}</a>
        <details className={styles.mobileMenu} name="desktop-navigation" ref={menu} onToggle={(event) => {
          setMenuOpen(event.currentTarget.open);
          if (!event.currentTarget.open) event.currentTarget.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((item) => { item.open = false; });
        }}>
          <summary className={styles.menuToggle} aria-label={t("navigation.menuLabel")} aria-controls="mobile-navigation">
            <span /><span />
          </summary>
          <div className={styles.mobilePanel} id="mobile-navigation">
            <nav aria-label={t("navigation.mobileLabel")}>
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
                    ) : <a className={styles.mobileLink} href={link.href} aria-current={link.href === home && pathname === "/" ? "page" : undefined} onClick={() => closeMenu()}><span className={styles.number} aria-hidden="true">0{index + 1}</span>{link.label}</a>}
                  </li>
                ))}
              </ul>
            </nav>
            <a className={styles.application} href={application} onClick={() => closeMenu()}>{t("navigation.apply")}</a>
            <div className={styles.mobileLanguages} aria-label={t("languageSwitcher.label")}>
              <span className={styles.languageLabel}><Globe2 size={17} aria-hidden="true" />{t("languageSwitcher.label")}</span>
              <LanguageOptions onSelect={() => closeMenu()} />
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
