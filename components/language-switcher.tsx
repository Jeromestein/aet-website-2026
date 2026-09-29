"use client";

import { useRef, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { languageLabels, languageNames, routing, type Locale } from "@/i18n/routing";
import styles from "./navigation.module.css";

export function LanguageOptions({ onSelect }: { onSelect?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return <div aria-busy={pending}>
    {routing.locales.map((language) => (
      <Link key={language} href={pathname} locale={language} lang={language === "zh" ? "zh-Hans" : language}
        prefetch={false} scroll={false} aria-current={locale === language ? "page" : undefined}
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onSelect?.();
          startTransition(() => {
            router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: language, scroll: false });
          });
        }}>
        {languageNames[language]}{locale === language && <Check size={16} aria-hidden="true" />}
      </Link>
    ))}
  </div>;
}

export function LanguageSwitcher({ onOpen }: { onOpen?: () => void }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("languageSwitcher");
  const disclosure = useRef<HTMLDetailsElement>(null);

  return <details ref={disclosure} className={`${styles.dropdown} ${styles.language}`} name="desktop-navigation" data-desktop
    onToggle={(event) => { if (event.currentTarget.open) onOpen?.(); }}>
    <summary aria-label={t("choose")}><Globe2 size={18} aria-hidden="true" /><span>{languageLabels[locale]}</span><ChevronDown size={13} aria-hidden="true" /></summary>
    <div className={`${styles.submenu} ${styles.languageOptions}`}>
      <LanguageOptions onSelect={() => {
        if (!disclosure.current) return;
        disclosure.current.open = false;
        disclosure.current.querySelector("summary")?.focus({ preventScroll: true });
      }} />
    </div>
  </details>;
}
