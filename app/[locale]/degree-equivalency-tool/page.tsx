import type { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import { Prices } from "@/components/preeval/customer";
import { copy } from "@/lib/preeval/copy";
import { pathFor } from "@/lib/preeval/domain";
import { ArrowRight } from "lucide-react";
import s from "@/components/preeval/preeval.module.css";
import landing from "@/components/preeval/landing.module.css";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: copy(locale).eyebrow + " | AET",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params,
    t = copy(locale);
  return (
    <div className={s.page}>
      <Navigation />
      <main id="main-content" className={`${s.main} ${landing.main}`}>
        <section className={landing.hero} aria-labelledby="preeval-heading">
          <Image
            className={landing.photo}
            src="/images/graduates.jpg"
            alt={locale === "zh"
              ? "身穿学位服的毕业生在毕业典礼上庆祝"
              : locale === "es"
                ? "Graduados con toga celebrando en una ceremonia de graduación"
                : "Graduates in academic gowns celebrating at a graduation ceremony"}
            fill
            sizes="(max-width: 1320px) 100vw, 1280px"
            preload
          />
          <div className={landing.shade} aria-hidden="true" />
          <div className={landing.copy}>
            <p className={landing.eyebrow}>{t.eyebrow}</p>
            <h1 id="preeval-heading" className={landing.title} lang={locale}>
              {locale === "zh" ? <><span>了解您的学历</span><span>在美国对应的水平。</span></> : t.title}
            </h1>
            <p className={landing.intro}>{t.intro}</p>
            <div className={landing.actions}>
              <a className={s.button + " " + s.primary}
                href={pathFor(locale, "/degree-equivalency-tool/application")}>
                {t.start}<ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className={landing.statusLink} href={pathFor(locale, "/status-check")}>
                {t.check}
              </a>
            </div>
          </div>
        </section>
        <div className={landing.details}>
          <ol className={landing.steps}>
            {[t.step1, t.step2, t.step3].map((step, index) => (
              <li key={step}><span aria-hidden="true">0{index + 1}</span>{step}</li>
            ))}
          </ol>
          <section className={landing.offer} aria-labelledby="preeval-price-heading">
            <div className={landing.offerHeading}>
              <h2 id="preeval-price-heading">PRE-EVALUATION</h2>
              <div className={landing.price}>$19 <small>USD</small></div>
            </div>
            <Prices locale={locale} />
          </section>
          <p className={landing.note}>{t.note}</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
