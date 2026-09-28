"use client";

import Image from "next/image";
import { CardRail } from "./card-rail";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileCheck2, Globe2, GraduationCap } from "lucide-react";

const facts = [
  { value: "15+", title: "Years of experience", text: "Thousands of certified evaluations submitted.", Icon: GraduationCap },
  { value: "100+", title: "Language pairs", text: "English, Chinese, Spanish, French, German, Russian, Arabic, and more.", Icon: Globe2 },
  { value: "2009", title: "An ATA member since", text: "Member of the American Translators Association.", Icon: FileCheck2 },
];

export function ImpactStory() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 851px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (!media.matches || !root.current) return;
      const rect = root.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (110 - rect.top) / Math.max(1, rect.height - window.innerHeight)));
      setActive(Math.round(progress * (facts.length - 1)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const configure = () => { setEnhanced(media.matches); schedule(); };
    configure();
    media.addEventListener("change", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", configure); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  const select = (index: number) => {
    setActive(index);
    if (enhanced && root.current) {
      const rect = root.current.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top - 110 + (rect.height - window.innerHeight) * index / (facts.length - 1), behavior: "smooth" });
    }
  };
  return <section ref={root} className={`impact-story ${enhanced ? "is-enhanced" : ""}`} id="at-a-glance" aria-labelledby="impact-title">
    <div className="impact-scene wrap">
      <div className="impact-intro">
        <span className="eyebrow">AET AT A GLANCE</span>
        <h2 id="impact-title">Why Choose Us</h2>
        <p>Professional translation and credential evaluation services.</p>
        <div className="impact-rating">
          <Image src="/images/bbb-hero-transparent.png" alt="BBB A+ Rating" width={2172} height={724} sizes="(max-width: 760px) 240px, 288px" />
          <p>Rated A+ by the Better Business Bureau, its highest rating. We’re committed to dependable service, clear communication, and customer care.</p>
        </div>
      </div>
      <CardRail className="impact-orbit" label="AET facts">
        <span className="orbit-spark spark-one" aria-hidden="true" /><span className="orbit-spark spark-two" aria-hidden="true" />
        {facts.map(({ value, title, text, Icon }, i) => <article data-rail-card key={value} className={`impact-fact ${value === "2009" ? "wide-figure" : ""} ${i === active ? "is-active" : ""}`} aria-hidden={enhanced ? i !== active : undefined}>
          <Icon className="fact-icon" size={54} strokeWidth={1.1} aria-hidden="true" /><strong>{value}</strong><h3>{title}</h3><p>{text}</p>
        </article>)}
        <div className="story-dots" aria-label="AET highlights">{facts.map((fact, i) => <button key={fact.value} type="button" aria-label={`Show ${fact.title}`} aria-pressed={active === i} onClick={() => select(i)}><span /></button>)}</div>
      </CardRail>
    </div>
  </section>;
}

const steps = [
  { label: "YOUR GOAL", title: "Choose your evaluation type", text: "Choose your evaluation type based on your purpose.", image: "/images/hero.webp", alt: "A woman working at her laptop", caption: "Choose your evaluation type" },
  { label: "YOUR DOCUMENTS", title: "Provide your documents", text: "Complete our application form. Submit documents to any of our offices.", image: "/images/document-consultation.jpg", alt: "Two women reviewing documents together in a bright office", caption: "Application and documents" },
  { label: "YOUR RESULTS", title: "Receive your evaluation", text: "Contact our team for guidance on your evaluation report and next steps.", image: "/images/graduates.jpg", alt: "Graduates celebrating their academic achievement", caption: "Your evaluation and next steps" },
];

function StepVisual({ index }: { index: number }) {
  const step = steps[index];
  // Landscape photos fill a portrait frame: request pixels for the covered height too.
  const sizes = index === 1
    ? "(max-width: 850px) 90vw, 48vw"
    : "(max-width: 540px) max(90vw, 516px), (max-width: 850px) max(90vw, 569px), max(48vw, min(1103px, 124.45vh))";
  return <Image src={step.image} alt={step.alt} fill sizes={sizes} className={index === 1 ? "consultation-image" : undefined} />;
}

export function ProcessStory() {
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
    <div className="journey-heading"><span className="eyebrow">02 / A CLEAR PATH FORWARD</span><h2 id="journey-title">Simple 3-Step Process</h2><p>Choose your evaluation type based on your purpose.</p></div>
    <div className="journey-layout"><div className="journey-media">
      {steps.map((step, i) => <div key={step.label} className={`journey-photo ${i === active ? "is-active" : ""}`} aria-hidden={i !== active}><StepVisual index={i} /><div className="journey-caption"><span>0{i + 1}</span>{step.caption}</div></div>)}
      <div className="journey-progress" aria-hidden="true">{steps.map((step, i) => <span key={step.label} className={i <= active ? "is-active" : ""} />)}</div>
    </div><div className="journey-stages">{steps.map((step, i) => <article key={step.label} className={`journey-stage ${i === active ? "is-active" : ""}`}><div className="journey-mobile-image"><StepVisual index={i} /></div><div className="journey-card"><span className="journey-number">0{i + 1}</span><div><span className="eyebrow">{step.label}</span><h3>{step.title}</h3><p>{step.text}</p>{i === 2 && <a className="text-link" href="https://app.americantranslationservice.com/credential-evaluation-application">Start Application <ArrowUpRight size={18} /></a>}</div></div></article>)}</div></div>
  </div></section>;
}
