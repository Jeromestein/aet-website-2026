import type { Metadata } from "next";
import PreEvaluationShell from "@/components/preeval/shell";
import { Prices } from "@/components/preeval/customer";
import { copy } from "@/lib/preeval/copy";
import { pathFor } from "@/lib/preeval/domain";
import { ArrowRight, GraduationCap } from "lucide-react";
import s from "@/components/preeval/preeval.module.css";
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
    <PreEvaluationShell locale={locale}>
      <div className={s.heroGrid}>
        <div>
          <p className={s.eyebrow}>{t.eyebrow}</p>
          <h1 className={s.title}>{t.title}</h1>
          <p className={s.intro}>{t.intro}</p>
          <div className={s.buttons}>
            <a
              className={s.button + " " + s.primary}
              href={pathFor(locale, "/degree-equivalency-tool/application")}
            >
              {t.start}
              <ArrowRight size={18} />
            </a>
            <a className={s.secondary} href={pathFor(locale, "/status-check")}>
              {t.check}
            </a>
          </div>
        </div>
        <section className={s.card}>
          <GraduationCap size={40} color="var(--accent)" />
          <p className={s.eyebrow} style={{ marginTop: 20 }}>
            PRE-EVALUATION
          </p>
          <div className={s.price}>
            $19 <small>USD</small>
          </div>
          <Prices locale={locale} />
        </section>
      </div>
      <ol className={s.steps}>
        {[t.step1, t.step2, t.step3].map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ol>
      <p className={s.note}>{t.note}</p>
    </PreEvaluationShell>
  );
}
