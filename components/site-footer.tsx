import Image from "next/image";
import { SocialIcon } from "./social-icon";
import styles from "./site-footer.module.css";

const legacy = "https://www.americantranslationservice.com";
const services = [
  ["Certified Translation", "/e-notarized.php"],
  ["Interpretation", "/e-interpretation.php"],
  ["Visa", "/e-visaservice.php"],
  ["Consular Authentication", "/e-authentication.php"],
];
const popular = [
  ["Service Fee", "/e-fee.php"],
  ["Contact Us", "/e-contact.php"],
  ["About AET", "/e-aboutus.php"],
  ["Career", "/e-careers.php"],
];
const offices = [
  ["Miami", "miami"],
  ["Boston", "boston"],
  ["Los Angeles", "los-angeles"],
  ["Beijing", "beijing"],
];
const social = [
  ["LinkedIn", "https://www.linkedin.com/company/american-education-&-translation-services-aet-"],
  ["Yelp", "https://www.yelp.com/biz/american-education-and-translation-services-malden"],
  ["Facebook", "https://www.facebook.com/MiamiAET/"],
  ["Google", "https://www.google.com/search?q=american+education+translation+services&oq=american+education+translation+services&aqs=chrome..69i57j69i60l2j35i39i362l3j46i39i362j35i39i362.213j0j7&sourceid=chrome&ie=UTF-8"],
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer} id="site-footer">
      <div className="wrap">
        <div className={styles.main}>
          <div className={styles.brand}>
            <a href="/" className={styles.logo} aria-label="AET home">
              <Image src="/brand/aet-logo-footer.svg" alt="American Education and Translation Services" width={520} height={120} />
            </a>
            <nav className={styles.social} aria-label="AET social media and reviews">
              {social.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}${label === "Google" || label === "Yelp" ? " reviews" : ""} (opens in a new tab)`}>
                  <SocialIcon name={label} />{label}
                </a>
              ))}
            </nav>
          </div>
          <nav className={styles.links} aria-label="Footer navigation">
            <div className={styles.services}>
              <h2>Top Service</h2>
              <a className={styles.featured} href={legacy + "/e-evaluation.php"}>Foreign Credential Evaluation</a>
              <h2 className={styles.more}>More Services</h2>
              <ul>{services.map(([label, path]) => <li key={path}><a href={legacy + path}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h2>Popular Links</h2>
              <ul>{popular.map(([label, path]) => <li key={path}><a href={legacy + path}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h2>Office</h2>
              <ul>{offices.map(([label, slug]) => <li key={slug}><a href={`${legacy}/e-office-${slug}.php`}>{label}</a></li>)}</ul>
            </div>
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>Copyright 2009 - Present American Education and Translation Services</p>
          <nav aria-label="Footer legal and blog links">
            <a href={legacy + "/blog"}>Blog</a>
            <a href={legacy + "/e-terms-of-use.php"}>Terms of Use</a>
            <a href={legacy + "/e-privacy-policy.php"}>Privacy Policy</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
