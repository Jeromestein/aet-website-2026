"use client";

import { useEffect, useRef, useState } from 'react';

export default function EmailFrame({ html, title, mobile }: { html: string; title: string; mobile: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const [height, setHeight] = useState(1400);
  useEffect(() => () => cleanup.current?.(), []);
  function loaded() {
    cleanup.current?.();
    const body = frame.current?.contentDocument?.body;
    if (!body) return;
    const stopLink = (event: MouseEvent) => {
      if ((event.target as Element).closest('a')) event.preventDefault();
    };
    body.addEventListener('click', stopLink);
    body.querySelectorAll('a').forEach(link => { link.setAttribute('aria-disabled', 'true'); link.tabIndex = -1; });
    const fit = () => setHeight(Math.max(640, Math.ceil(Math.max(0, ...Array.from(body.children, child => child.getBoundingClientRect().bottom))) + 16));
    const observer = new ResizeObserver(fit);
    observer.observe(body);
    body.querySelectorAll('img').forEach(img => img.addEventListener('load', fit));
    fit();
    cleanup.current = () => { observer.disconnect(); body.removeEventListener('click', stopLink); body.querySelectorAll('img').forEach(img => img.removeEventListener('load', fit)); };
  }
  return <iframe ref={frame} title={title + ' email'} srcDoc={html} sandbox="allow-same-origin" referrerPolicy="no-referrer" onLoad={loaded} style={{ display: 'block', width: mobile ? 390 : '100%', maxWidth: '100%', height, border: 0, margin: 'auto', background: '#F8FBFE', borderRadius: 12 }} />;
}
