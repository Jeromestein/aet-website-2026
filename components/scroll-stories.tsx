"use client";

import { useTranslations } from "next-intl";

import Image from "next/image";
import { CardRail } from "./card-rail";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, FileCheck2, Globe2, GraduationCap, ShieldCheck, SquarePen, Star } from "lucide-react";

function useFacts() {
  const t = useTranslations();
  return [
  { value: "15+", title: t("home.facts.experience"), text: t("home.facts.experienceText"), Icon: GraduationCap },
  { value: "100+", title: t("home.facts.languages"), text: t("home.facts.languagesText"), Icon: Globe2 },
  { value: "2009", title: t("home.facts.ata"), text: t("home.facts.ataText"), Icon: FileCheck2 },
  { value: "A+", title: t("home.facts.bbb"), text: t("home.facts.bbbText"), Icon: ShieldCheck },
  { value: "5", title: t("home.facts.reviews"), text: t("home.facts.reviewsText"), Icon: Star },
];
}

function getImpactScrollRange(section: HTMLElement) {
  const scene = section.querySelector<HTMLElement>(".impact-scene")!;
  const sectionRect = section.getBoundingClientRect();
  const stickyTop = parseFloat(getComputedStyle(scene).top) || 0;
  return {
    start: window.scrollY + sectionRect.top - stickyTop,
    distance: Math.max(1, sectionRect.height - scene.getBoundingClientRect().height),
  };
}

export function ImpactStory() {
  const t = useTranslations();
  const facts = useFacts();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const rail = section.querySelector<HTMLElement>(".impact-orbit");
    const media = window.matchMedia("(min-width: 851px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const sync = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      let motionProgress = 0;
      if (media.matches) {
        const { start, distance } = getImpactScrollRange(section);
        const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
        // Give every fact a full interval, including the last one before unpinning.
        setActive(Math.min(facts.length - 1, Math.floor(progress * facts.length)));
        motionProgress = progress;
      } else {
        const passing = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
        const railProgress = rail && rail.scrollWidth > rail.clientWidth
          ? rail.scrollLeft / (rail.scrollWidth - rail.clientWidth) : 0;
        motionProgress = (passing + railProgress) / 2;
      }
      section.style.setProperty("--impact-progress", String(reducedMotion.matches ? 0 : motionProgress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const configure = () => {
      setEnhanced(media.matches);
      section.dataset.motion = String(!reducedMotion.matches);
      schedule();
    };
    configure();
    media.addEventListener("change", configure);
    reducedMotion.addEventListener("change", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    rail?.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", configure);
      reducedMotion.removeEventListener("change", configure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      rail?.removeEventListener("scroll", schedule);
    };
  }, []);
  const select = (index: number) => {
    setActive(index);
    if (enhanced && root.current) {
      const { start, distance } = getImpactScrollRange(root.current);
      window.scrollTo({ top: start + distance * (index + .5) / facts.length, behavior: "smooth" });
    }
  };
  return <section ref={root} className={`impact-story ${enhanced ? "is-enhanced" : ""}`} id="at-a-glance" aria-labelledby="impact-title" style={{ "--fact-count": facts.length } as CSSProperties}>
    <div className="impact-scene wrap">
      <div className="impact-bubbles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => <span key={i} className={`impact-bubble bubble-${i + 1}`}><i /></span>)}
      </div>
      <div className="impact-intro">
        <span className="eyebrow">{t("home.facts.eyebrow")}</span>
        <h2 id="impact-title">{t("home.facts.title")}</h2>
        <p>{t("home.facts.text")}</p>
      </div>
      <CardRail className="impact-orbit" label={t("home.facts.label")}>
        {facts.map(({ value, title, text, Icon }, i) => <article data-rail-card key={value} className={`impact-fact ${value === "2009" ? "wide-figure" : ""} ${i === active ? "is-active" : ""}`} aria-hidden={enhanced ? i !== active : undefined}>
          {value === "5" ? <div className="fact-review-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={24} fill="currentColor" strokeWidth={1.2} />)}</div> : <Icon className="fact-icon" size={54} strokeWidth={1.1} aria-hidden="true" />}
          <strong>{value}</strong><h3>{title}</h3><p>{text}</p>
        </article>)}
        <div className="story-dots" aria-label={t("home.facts.highlights")}>{facts.map((fact, i) => <button key={fact.value} type="button" aria-label={t("home.facts.show", { title: fact.title })} aria-pressed={active === i} onClick={() => select(i)}><span /></button>)}</div>
      </CardRail>
    </div>
  </section>;
}

function useSteps() {
  const t = useTranslations();
  return [
  { label: t("home.process.purposeLabel"), title: t("home.process.purposeTitle"), text: t("home.process.purposeText"), image: "/images/application/application-purpose.png", alt: t("home.process.purposeAlt"), caption: t("home.process.purposeCaption") },
  { label: t("home.process.applicationLabel"), title: t("home.process.applicationTitle"), text: t("home.process.applicationText"), image: "/images/application/client-information.png", alt: t("home.process.applicationAlt"), caption: t("home.process.applicationCaption") },
  { label: t("home.process.evaluationLabel"), title: t("home.process.evaluationTitle"), text: t("home.process.evaluationText"), image: "/images/application/service-selection.png", alt: t("home.process.evaluationAlt"), caption: t("home.process.evaluationTitle") },
  { label: t("home.process.documentsLabel"), title: t("home.process.documentsTitle"), text: t("home.process.documentsText"), image: "/images/application/document-upload.png", alt: t("home.process.documentsAlt"), caption: t("home.process.documentsCaption") },
];
}

function StepVisual({ index }: { index: number }) {
  const t = useTranslations();
  const steps = useSteps();
  const step = steps[index];
  return <><div className="journey-screen-label">{t("home.process.screen")}</div><div className="journey-screen"><Image src={step.image} alt={step.alt} fill sizes="(max-width: 850px) 90vw, 48vw" /></div></>;
}

export function ProcessStory() {
  const t = useTranslations();
  const steps = useSteps();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 851px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)");
    const cards = Array.from(root.current?.querySelectorAll<HTMLElement>(".journey-stage") ?? []);
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (!media.matches) return;
      const middle = window.innerHeight * .55;
      let closest = 0;
      let distance = Infinity;
      cards.forEach((card, i) => { const rect = card.getBoundingClientRect(); const next = Math.abs(rect.top + rect.height / 2 - middle); if (next < distance) { closest = i; distance = next; } });
      setActive(closest);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const configure = () => { setEnhanced(media.matches); schedule(); };
    configure();
    media.addEventListener("change", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { media.removeEventListener("change", configure); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  return <section ref={root} className={`journey-story ${enhanced ? "is-enhanced" : ""}`} id="process" aria-labelledby="journey-title"><div className="wrap">
    <div className="journey-heading"><span className="eyebrow">{t("home.process.eyebrow")}</span><h2 id="journey-title">{t("home.process.title")}</h2><p>{t("home.process.text")}</p><a className="button journey-apply" href="https://app.americantranslationservice.com/credential-evaluation-application"><SquarePen size={24} aria-hidden="true" />{t("home.process.action")}<ArrowUpRight size={24} aria-hidden="true" /></a></div>
    <div className="journey-layout"><div className="journey-media">
      {steps.map((step, i) => <div key={step.image} className={`journey-photo ${i === active ? "is-active" : ""}`} aria-hidden={i !== active}><StepVisual index={i} /><div className="journey-caption"><span>0{i + 1}</span>{step.caption}</div></div>)}
      <div className="journey-progress" aria-hidden="true">{steps.map((step, i) => <span key={step.image} className={i <= active ? "is-active" : ""} />)}</div>
    </div><div className="journey-stages">{steps.map((step, i) => <article key={step.image} className={`journey-stage ${i === active ? "is-active" : ""}`}><div className="journey-mobile-image"><StepVisual index={i} /></div><div className="journey-card"><span className="journey-number">0{i + 1}</span><div><span className="eyebrow">{step.label}</span><h3>{step.title}</h3><p>{step.text}</p>{i === steps.length - 1 && <a className="text-link" href="https://app.americantranslationservice.com/credential-evaluation-application">{t("home.process.action")} <ArrowUpRight size={18} /></a>}</div></div></article>)}</div></div>
  </div></section>;
}
