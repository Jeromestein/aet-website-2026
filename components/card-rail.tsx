"use client";

import { useTranslations } from "next-intl";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Native scrolling remains available before hydration and without JavaScript. */
export function CardRail({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const t = useTranslations();
  const id = useId();
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, total: 0, start: true, end: false });
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const sync = () => {
      const cards = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-rail-card]"));
      const left = el.getBoundingClientRect().left;
      let index = 0;
      let distance = Infinity;
      cards.forEach((card, i) => {
        const next = Math.abs(card.getBoundingClientRect().left - left);
        if (next < distance) { index = i; distance = next; }
      });
      const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      setPosition({ index: end ? Math.max(0, cards.length - 1) : index, total: cards.length, start: el.scrollLeft < 2, end });
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    el.addEventListener("scroll", sync, { passive: true });
    return () => { observer.disconnect(); el.removeEventListener("scroll", sync); };
  }, []);
  const move = (direction: number) => {
    const el = rail.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-rail-card]"));
    const target = cards[Math.max(0, Math.min(cards.length - 1, position.index + direction))];
    if (!target) return;
    el.scrollTo({ left: el.scrollLeft + target.getBoundingClientRect().left - el.getBoundingClientRect().left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return <div className="rail-shell">
    <div ref={rail} id={id} className={`${className} card-rail`} role="region" aria-label={label} tabIndex={0}>{children}</div>
    {position.total > 1 && <div className="rail-controls">
      <span aria-hidden="true">{position.index + 1} / {position.total}</span>
      <button type="button" aria-label={t("controls.previous", { label })} aria-controls={id} disabled={position.start} onClick={() => move(-1)}><ArrowLeft size={18} /></button>
      <button type="button" aria-label={t("controls.next", { label })} aria-controls={id} disabled={position.end} onClick={() => move(1)}><ArrowRight size={18} /></button>
    </div>}
  </div>;
}
