import { socialLinks } from "@/lib/organization";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { contactPath, featuredOffices, officePath } from "@/lib/contact";
import { SocialIcon } from "./social-icon";
import styles from "./site-footer.module.css";

const legacy = "https://www.americantranslationservice.com";


export function SiteFooter() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const services = [
    [t("navigation.certified"), "/certified-translation"],
    [t("navigation.interpretation"), "/interpretation"],
    [t("navigation.visa"), "/visa-service"],
  ];
  const popular = [
    [t("pricing.title"), "/pricing"],
    [t("navigation.payment"), "/payment"],
    [t("home.contact"), "/contact"],
    [t("footer.about"), "/about"],
    [t("footer.career"), "/career"],
  ];

  return (
    <footer className={styles.footer} id="site-footer">
      <div className="wrap">
        <div className={styles.main}>
          <div className={styles.brand}>
            <a href={getPathname({ locale, href: "/" })} className={styles.logo} aria-label={t("navigation.homeLabel")}>
              <Image src="/brand/aet-logo-footer.svg" alt="American Education and Translation Services,CORP (AET)" width={520} height={120} />
            </a>
            <nav className={styles.social} aria-label={t("footer.socialLabel")}>
              {socialLinks.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={t("footer.newTab", { name: label === "Google" || label === "Yelp" ? t("footer.reviewLink", { name: label }) : label })}>
                  <SocialIcon name={label} />{label}
                </a>
              ))}
            </nav>
          </div>
          <nav className={styles.links} aria-label={t("footer.label")}>
            <div className={styles.services}>
              <h2>{t("footer.top")}</h2>
              <a className={styles.featured} href={getPathname({ locale, href: "/evaluation" })}>{t("home.services.title")}</a>
              <h2 className={styles.more}>{t("footer.more")}</h2>
              <ul>{services.map(([label, path]) => <li key={path}><a href={getPathname({ locale, href: path })}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h2>{t("footer.popular")}</h2>
              <ul>{popular.map(([label, path]) => <li key={path}><a href={path === "/contact" ? contactPath(locale) : path.startsWith('/e-') ? legacy + path : getPathname({ locale, href: path })}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h2>{t("footer.office")}</h2>
              <ul>{featuredOffices.map(office => <li key={office.id}><a href={officePath(locale, office)}>{t(`footer.${office.footerKey}`)}</a></li>)}</ul>
            </div>
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>{t("footer.copyright")}</p>
          <nav aria-label={t("footer.legal")}>
            <a href={getPathname({ locale, href: "/blog" })}>{t("navigation.blog")}</a>
            <a href="/terms">{t("footer.terms")}</a>
            <a href="/privacy">{t("footer.privacy")}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
