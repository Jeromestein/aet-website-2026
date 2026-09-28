"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import reviews from "./testimonials.json";
import styles from "./testimonial-carousel.module.css";

export function TestimonialCarousel() {
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
    <section className={`${styles.section} section wrap`} id="stories" aria-labelledby="testimonials-title" aria-roledescription="carousel">
      <div className={styles.heading}>
        <div>
          <span className="eyebrow">03 / CLIENT FEEDBACK</span>
          <h2 id="testimonials-title">What Our Clients Say</h2>
        </div>
        <div className={styles.googleRating}>
          <span className={styles.googleLabel}>Google reviews</span>
          <div className={styles.ratingScore} aria-label="Rated 5.0 out of 5 on Google">
            <strong aria-hidden="true">5.0</strong>
            <span className={styles.ratingStars} aria-hidden="true">★★★★★</span>
          </div>
          <a href="https://www.google.com/search?q=american+education+and+translation+services+%28aet%29+florida" target="_blank" rel="noopener noreferrer" aria-label="Read more reviews on Google (opens in a new tab)">
            Read more reviews <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
      {ready && <div className={styles.controls}>
        <span aria-live="polite" aria-atomic="true">
          {position.first + 1}{position.last > position.first ? `–${position.last + 1}` : ""} / {reviews.length}
        </span>
        <button type="button" aria-label="Previous client testimonial" aria-controls="testimonial-rail" onClick={() => move(-1)}><ArrowLeft size={20} aria-hidden="true" /></button>
        <button type="button" aria-label="Next client testimonial" aria-controls="testimonial-rail" onClick={() => move(1)}><ArrowRight size={20} aria-hidden="true" /></button>
      </div>}
      <div ref={rail} className={styles.rail} id="testimonial-rail" role="region" aria-label="Client testimonials" tabIndex={0}>
        {reviews.map((review, index) => (
          <article className={styles.card} key={review.name} aria-label={`${index + 1} of ${reviews.length}: ${review.name}`}>
            <div className={styles.person}>
              <img src={review.image} width={48} height={48} alt="" loading="lazy" />
              <div>
                <h3>{review.name}</h3>
                <span className={styles.stars} role="img" aria-label="5 out of 5 stars">★★★★★</span>
              </div>
            </div>
            <blockquote>{review.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}
