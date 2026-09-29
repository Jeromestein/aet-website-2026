import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { SocialIcon } from "./social-icon";
import styles from "./site-footer.module.css";

const legacy = "https://www.americantranslationservice.com";
const social = [
  ["LinkedIn", "https://www.linkedin.com/company/american-education-&-translation-services-aet-"],
  ["Yelp", "https://www.yelp.com/biz/american-education-and-translation-services-malden"],
  ["Facebook", "https://www.facebook.com/MiamiAET/"],
  ["Google", "https://www.google.com/search?q=american+education+translation+services&oq=american+education+translation+services&aqs=chrome..69i57j69i60l2j35i39i362l3j46i39i362j35i39i362.213j0j7&sourceid=chrome&ie=UTF-8"],
] as const;

export function SiteFooter() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const services = [
    [t("navigation.certified"), "/e-notarized.php"],
    [t("navigation.interpretation"), "/e-interpretation.php"],
  ];
  const popular = [
    [t("pricing.title"), "/pricing"],
    [t("home.contact"), "/e-contact.php"],
    [t("footer.about"), "/e-aboutus.php"],
    [t("footer.career"), "/e-careers.php"],
  ];
  const offices = [
    [t("footer.miami"), "miami"],
    [t("footer.boston"), "boston"],
    [t("footer.losAngeles"), "los-angeles"],
    [t("footer.beijing"), "beijing"],
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
              {social.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={t("footer.newTab", { name: label === "Google" || label === "Yelp" ? t("footer.reviewLink", { name: label }) : label })}>
                  <SocialIcon name={label} />{label}
                </a>
              ))}
            </nav>
          </div>
          <nav className={styles.links} aria-label={t("footer.label")}>
            <div className={styles.services}>
              <h2>{t("footer.top")}</h2>
              <a className={styles.featured} href={legacy + "/e-evaluation.php"}>{t("home.services.title")}</a>
              <h2 className={styles.more}>{t("footer.more")}</h2>
              <ul>{services.map(([label, path]) => <li key={path}><a href={legacy + path}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h2>{t("footer.popular")}</h2>
              <ul>{popular.map(([label, path]) => <li key={path}><a href={path === "/pricing" ? getPathname({ locale, href: "/pricing" }) : legacy + path}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h2>{t("footer.office")}</h2>
              <ul>{offices.map(([label, slug]) => <li key={slug}><a href={`${legacy}/e-office-${slug}.php`}>{label}</a></li>)}</ul>
            </div>
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>{t("footer.copyright")}</p>
          <nav aria-label={t("footer.legal")}>
            <a href={legacy + "/blog"}>{t("navigation.blog")}</a>
            <a href={legacy + "/e-terms-of-use.php"}>{t("footer.terms")}</a>
            <a href={legacy + "/e-privacy-policy.php"}>{t("footer.privacy")}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
