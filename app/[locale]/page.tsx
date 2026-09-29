import { documentEvaluationStandard } from "@/lib/pricing";
import { formatMoney } from "@/lib/pricing-format";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import Image from "next/image";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { SiteFooter } from "@/components/site-footer";
import { CardRail } from "@/components/card-rail";
import { InstitutionCarousel } from "@/components/institution-carousel";
import { ImpactStory, ProcessStory } from "@/components/scroll-stories";
import {
  ArrowUpRight,
  GraduationCap,
  Languages,
  FileCheck2,
  MessageCircle,
  Plus,
  SquarePen,
  Phone,
  CircleCheck,
} from "lucide-react";
import { Navigation, RevealObserver } from "@/components/navigation";
const old = "https://www.americantranslationservice.com";
const apply =
  "https://app.americantranslationservice.com/credential-evaluation-application";
const pre =
  "https://app.americantranslationservice.com/degree-equivalency-tool";
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const services = [
    { icon: Languages, number: "02", title: t("navigation.certified"), text: t("home.services.certifiedText"), href: "/certified-translation", tag: t("home.services.translationTag") },
    { icon: MessageCircle, number: "03", title: t("navigation.interpretation"), text: t("home.services.interpretationText"), href: "/interpretation", tag: t("navigation.interpretation") },
    { icon: FileCheck2, number: "04", title: t("navigation.technical"), text: t("home.services.technicalText"), href: "/technical-translation", tag: t("home.services.specializedTag") },
  ];
  const faqs = [
    [
      t("home.faq.q1"),
      t("home.faq.a1"),
    ],
    [
      t("home.faq.q2"),
      t("home.faq.a2", { days: documentEvaluationStandard.businessDays }),
    ],
    [
      t("home.faq.q3"),
      t("home.faq.a3"),
    ],
    [
      t("home.faq.q4"),
      t("home.faq.a4"),
    ],
  ];

  return (
    <>
      <a className="skip-link" href="#main-content">{t("home.skip")} </a>
      <Navigation />
      <RevealObserver />
      <main id="main-content">
        <div className="hero-band">
        <section className="hero wrap">
          <div className="hero-copy">
            <h1>
              {locale === "zh" ? <>
                <span>{t("home.hero.line1")}</span>
                <span>{t("home.hero.line2")}{t("home.hero.line3")}</span>
              </> : <>
                <span>{t("home.hero.line1")}</span>{" "}
                <span>{t("home.hero.line2")}</span>{" "}
                <span>{t("home.hero.line3")}</span>
              </>}
            </h1>
            <p className="hero-description">{t("home.hero.text")} </p>
            <div className="hero-buttons">
              <a className="button primary hero-apply" href={apply}>
                <SquarePen size={19} aria-hidden="true" /> {t("home.hero.apply")} </a>
              <a className="button hero-contact" href={old + "/e-contact.php"}>
                <Phone size={18} aria-hidden="true" /> {t("home.contact")} </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <Image
                src="/images/hero.webp"
                alt={t("home.hero.image")}
                fill
                sizes="(max-width: 760px) max(100vw, 1100px), max(60vw, 1210px)"
                loading="eager"
              />
            </div>
          </div>
        </section>
        </div>
        <section className="section wrap" id="services">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">{t("home.services.eyebrow")}</span>
              <h2>{t("home.services.title")} </h2>
            </div>
            <p>{t("home.services.intro")} </p>
          </div>
          <div className="fce-overview">
            <div className="fce-introduction">
              <h3>{t("home.services.whatTitle")}</h3>
              <p>{t("home.services.whatText")} </p>
            </div>
            <div className="fce-benefits">
              <h3>{t("home.services.why")}</h3>
              <ul>
                <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.services.fast")}</strong> {t("home.services.fastText", { days: documentEvaluationStandard.businessDays })}</span></li>
                <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.services.pricing")}</strong> {t("home.services.pricingText", { amount: formatMoney(documentEvaluationStandard.price, locale) })}</span></li>
                <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.services.response")}</strong> {t("home.services.responseText")}</span></li>
                <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.services.payment")}</strong> {t("home.services.paymentText")}</span></li>
              </ul>
            </div>
          </div>
          <div className="services-grid">
            <a
              href={getPathname({ locale, href: "/evaluation" })}
              className="featured-service"
              data-reveal
            >
              <div className="card-top">
                <GraduationCap size={31} />
                <span>01</span>
              </div>
              <div>
                <span className="small-label">{t("home.services.expertise")}</span>
                <h3>{t("home.services.types")} </h3>
              </div>
              <dl className="evaluation-types">
                <div><dt>{t("home.services.document")}</dt><dd>{t("home.services.documentText")}</dd></div>
                <div><dt>{t("home.services.course")}</dt><dd>{t("home.services.courseText")}</dd></div>
                <div><dt>{t("navigation.expert")}</dt><dd>{t("home.services.expertText")}</dd></div>
              </dl>
              <div className="card-bottom">
                <span>{t("home.services.learn")}</span>
                <span className="circle-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
            </a>
            <div className="other-services"><h3 className="rail-heading">{t("home.services.other")}</h3>
            <CardRail className="service-list" label={t("home.services.otherLabel")}>
              {services.map((s) => (
                <a
                  href={getPathname({ locale, href: s.href })}
                  className="service-row"
                  key={s.number}
                  data-rail-card
                  data-reveal
                >
                  <span className="service-icon">
                    <s.icon size={24} />
                  </span>
                  <div>
                    <span className="small-label">{s.tag}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                  <ArrowUpRight className="row-arrow" size={23} />
                </a>
              ))}
            </CardRail></div>
          </div>
          <div className="service-trust">
            <div className="service-rating">
              <Image src="/images/bbb-hero-transparent.png" alt={t("home.services.bbb")} width={2172} height={724} sizes="146px" />
            </div>
            <a href={old + "/e-contact.php"} className="text-link">{t("home.contact")} <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <ImpactStory />
        <InstitutionCarousel />
        <ProcessStory />
        <section className="section wrap" id="pre-evaluation" aria-labelledby="pre-evaluation-title">
          <div className="preview-panel" data-reveal>
            <div className="preview-photo">
              <Image
                src="/images/graduates.jpg"
                alt={t("home.preEvaluation.image")}
                fill
                sizes="(max-width: 760px) 100vw, 40vw"
              />
              <span className="image-note">{t("home.preEvaluation.imageLabel")} </span>
            </div>
            <div className="preview-copy">
              <span className="eyebrow">{t("home.preEvaluation.eyebrow")}</span>
              <h2 id="pre-evaluation-title">{t("home.preEvaluation.title")} </h2>
              <h3 className="preview-question">{t("home.preEvaluation.question")} </h3>
              <p>{t("home.preEvaluation.intro")} </p>
              <div className="preview-provisions">
                <h3>{t("home.preEvaluation.provide")}</h3>
                <ul>
                  <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.preEvaluation.instant")}</strong> {t("home.preEvaluation.instantText")}</span></li>
                  <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.preEvaluation.affordable")}</strong> {t("home.preEvaluation.affordableText")}</span></li>
                  <li><CircleCheck size={22} aria-hidden="true" /><span><strong>{t("home.preEvaluation.guidance")}</strong> {t("home.preEvaluation.guidanceText")}</span></li>
                </ul>
              </div>
              <p>{t("home.preEvaluation.closing")} </p>
              <a href={pre} className="button preview-action">{t("home.preEvaluation.action")} </a>
            </div>
          </div>
        </section>
        <section className="faq-section wrap" id="questions">
          <div data-reveal>
            <span className="eyebrow">{t("home.faq.eyebrow")}</span>
            <h2>{t("home.faq.title")} </h2>
            <a href={old + "/e-contact.php"} className="text-link">{t("home.contact")} <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="faq-list" data-reveal>
            {faqs.map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>
                  {q}
                  <Plus size={20} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <TestimonialCarousel />
      </main>
      <SiteFooter />
    </>
  );
}
