"use client";

import { useLocale, useTranslations } from "next-intl";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import reviews from "./testimonials.json";
import styles from "./testimonial-carousel.module.css";

export function TestimonialCarousel() {
  const t = useTranslations();
  const locale = useLocale();
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ first: 0, last: 1 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const sync = () => {
      const cards = Array.from(element.children) as HTMLElement[];
      const left = element.getBoundingClientRect().left;
      const visible = cards.map((card, index) => ({ rect: card.getBoundingClientRect(), index }))
        .filter(({ rect }) => rect.left >= left - 2 && rect.right <= left + element.clientWidth + 2);
      if (visible.length) {
        setPosition({ first: visible[0].index, last: visible[visible.length - 1].index });
      }
    };
    sync();
    setReady(true);
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    Array.from(element.children).forEach((card) => observer.observe(card));
    element.addEventListener("scroll", sync, { passive: true });
    return () => { observer.disconnect(); element.removeEventListener("scroll", sync); };
  }, []);

  const move = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    const atStart = element.scrollLeft < 2;
    const atEnd = element.scrollLeft >= max - 2;
    const step = (element.children[1] as HTMLElement).offsetLeft - (element.children[0] as HTMLElement).offsetLeft;
    const left = direction > 0 && atEnd ? 0 : direction < 0 && atStart ? max : Math.round(element.scrollLeft / step) * step + direction * step;
    element.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <section className={`${styles.section} section wrap`} id="stories" aria-labelledby="testimonials-title" aria-roledescription={t("controls.carousel")}>
      <div className={styles.heading}>
        <div>
          <span className="eyebrow">{t("home.testimonials.eyebrow")}</span>
          <h2 id="testimonials-title">{t("home.testimonials.title")}</h2>
        </div>
        <div className={styles.googleRating}>
          <span className={styles.googleLabel}>{t("home.testimonials.google")}</span>
          <div className={styles.ratingScore} aria-label={t("home.testimonials.rating")}>
            <strong aria-hidden="true">5.0</strong>
            <span className={styles.ratingStars} aria-hidden="true">★★★★★</span>
          </div>
          <a href="https://www.google.com/search?q=american+education+and+translation+services+%28aet%29+florida" target="_blank" rel="noopener noreferrer" aria-label={t("home.testimonials.moreLabel")}>{t("home.testimonials.more")} <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
      {ready && <div className={styles.controls}>
        <span aria-live="polite" aria-atomic="true">
          {position.first + 1}{position.last > position.first ? `–${position.last + 1}` : ""} / {reviews.length}
        </span>
        <button type="button" aria-label={t("home.testimonials.previous")} aria-controls="testimonial-rail" onClick={() => move(-1)}><ArrowLeft size={20} aria-hidden="true" /></button>
        <button type="button" aria-label={t("home.testimonials.next")} aria-controls="testimonial-rail" onClick={() => move(1)}><ArrowRight size={20} aria-hidden="true" /></button>
      </div>}
      <div ref={rail} className={styles.rail} id="testimonial-rail" role="region" aria-label={t("home.testimonials.label")} tabIndex={0}>
        {reviews.map((review, index) => (
          <article className={styles.card} key={review.name} aria-label={t("home.testimonials.position", { index: index + 1, total: reviews.length, name: review.name })}>
            <div className={styles.person}>
              <img src={review.image} width={48} height={48} alt="" loading="lazy" />
              <div>
                <h3>{review.name}</h3>
                <span className={styles.stars} role="img" aria-label={t("home.testimonials.stars")}>★★★★★</span>
              </div>
            </div>
            <blockquote><p>{t(`home.testimonials.reviews.${index}`)}</p></blockquote>
            {locale !== "en" && <p className={styles.translationNote}>{t("home.testimonials.translated")}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
