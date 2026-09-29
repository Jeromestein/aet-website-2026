"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { contactPath } from "@/lib/contact";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { homeInstitutions, type Institution } from "@/lib/institutions";
import styles from "./institution-carousel.module.css";

type Props = { id?: string; title?: string; institutions?: Institution[]; variant?: "home" | "embedded"; contactLabel?: string };

export function InstitutionCarousel({ id = "institutions", title, institutions = homeInstitutions, variant = "home", contactLabel }: Props) {
  const midpoint = Math.ceil(institutions.length / 2);
  const rows = [institutions.slice(0, midpoint), institutions.slice(midpoint)];
  const embedded = variant === "embedded";
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  return (
    <section id={id} className={`${styles.section} ${embedded ? styles.embedded : ""}`} aria-labelledby={`${id}-title`} data-ready={ready}>
      <div className={`wrap ${styles.heading}`}>
        {!embedded && <span className="eyebrow">{t("home.institutions.eyebrow")}</span>}
        <h2 id={`${id}-title`}>{title ?? t("home.institutions.title")}</h2>
        {!embedded && <p>{t("home.institutions.text")}</p>}
      </div>
      <div className={styles.carousel} role="group" aria-label={t("home.institutions.logos")} aria-roledescription={t("controls.carousel")}>
        {rows.map((row, rowIndex) => (
          <div className={styles.row} key={rowIndex} tabIndex={0} role="group" aria-label={t("home.institutions.row", { number: rowIndex + 1 })}>
            <div className={styles.track}>
              {[false, true].map((duplicate) => (
                <ul className={`${styles.group} ${duplicate ? styles.duplicate : ""}`} key={String(duplicate)} aria-hidden={duplicate || undefined}>
                  {row.map((institution) => (
                    <li className={styles.card} key={institution.name} title={institution.name}>
                      <div className={styles.logo} data-format={institution.format}>
                        <Image src={institution.src} alt={duplicate ? "" : institution.name} fill sizes={institution.format === "emblem" ? "(max-width: 600px) 64px, 80px" : "(max-width: 600px) 148px, 200px"} />
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`wrap ${styles.footer}`}>
        {embedded ? <a className="text-link" href={contactPath(locale)}>{contactLabel} <ArrowUpRight size={16} aria-hidden="true" /></a> : <p>{t("home.institutions.closing")}{" "}
          <a className="text-link" href="https://www.americantranslationservice.com/e-credential-evaluation-partners.php">{t("home.institutions.explore")} <ArrowUpRight size={16} aria-hidden="true" /></a>
        </p>}
      </div>
    </section>
  );
}
