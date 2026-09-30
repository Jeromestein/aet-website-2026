'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, Search, X } from 'lucide-react';
import type { DirectoryCopy, DirectorySection } from '@/lib/institution-directory';
import styles from './institutions.module.css';

export function InstitutionDirectory({ sections, copy }: { sections: DirectorySection[]; copy: DirectoryCopy }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [ready, setReady] = useState(false);
  const reset = () => { setQuery(''); setCategory('all'); };

  useEffect(() => {
    setReady(true);
    // Legacy section links must remain reachable after filtering as well.
    const onHashChange = () => {
      if (sections.some(section => `#${section.id}` === window.location.hash)) {
        setQuery('');
        setCategory('all');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [sections]);

  useEffect(() => {
    if (category === 'all' && !query && window.location.hash) {
      const target = sections.find(section => `#${section.id}` === window.location.hash);
      if (target) document.getElementById(target.id)?.scrollIntoView();
    }
  }, [category, query, sections]);

  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = sections.map(section => ({ ...section, entries: section.entries.filter(entry =>
    (category === 'all' || category === section.id) && words.every(word =>
      `${entry.name} ${entry.description} ${entry.note} ${entry.initials ?? ''} ${section.title}`.toLocaleLowerCase().includes(word))) }));
  const total = sections.reduce((sum, section) => sum + section.entries.length, 0);
  const count = filtered.reduce((sum, section) => sum + section.entries.length, 0);

  return <div className={`wrap ${styles.directory}`} id="directory">
    <div className={styles.directoryHeading}><div><span className="eyebrow">{copy.label}</span><h2>{copy.summary}</h2></div>
      <p>{String(total).padStart(2, '0')} <span>{copy.entries}</span></p>
    </div>
    <div className={styles.tools} hidden={!ready}>
      <label className={styles.search}>
        <Search size={23} aria-hidden="true" /><span className={styles.srOnly}>{copy.search}</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy.placeholder} aria-controls="institution-results" />
      </label>
      <div className={styles.filters} role="group" aria-label={copy.categories}>
        {[{ id: 'all', title: copy.all, entries: sections.flatMap(section => section.entries) }, ...sections].map(section =>
          <button type="button" key={section.id} aria-pressed={category === section.id} aria-controls="institution-results" onClick={() => setCategory(section.id)}>
            {section.title}<span>{section.entries.length}</span>
          </button>)}
      </div>
      <div className={styles.resultBar}>
        <p role="status" aria-live="polite" aria-atomic="true">{copy.count.replace('{count}', String(count)).replace('{total}', String(total))}</p>
        {(query || category !== 'all') && <button type="button" onClick={reset}><X size={16} aria-hidden="true" />{copy.reset}</button>}
      </div>
    </div>
    <noscript><nav className={styles.filters} aria-label={copy.categories}>{sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav></noscript>
    <div id="institution-results">
      {filtered.map((section, index) => <section key={section.id} id={section.id} className={styles.group} hidden={!section.entries.length} aria-labelledby={`${section.id}-title`}>
        <header className={styles.groupHeading}>
          <span className={styles.sectionNumber} aria-hidden="true">0{index + 1}</span>
          <div><h2 id={`${section.id}-title`}>{section.title}</h2><p>{section.description}</p></div>
        </header>
        <ul className={styles.grid} data-featured={section.id === 'featured'}>
          {section.entries.map(entry => <li key={entry.id}>
            <article className={styles.card}>
              <div className={styles.logo} aria-hidden="true">
                {entry.logo ? <img src={entry.logo} alt="" width={180} height={80} loading="lazy" decoding="async" /> : <span>{entry.initials}</span>}
              </div>
              <h3 lang="en">{entry.name}</h3><p>{entry.description}</p>
              <details className={styles.notes}><summary>{copy.notes}</summary><p>{entry.note}</p></details>
            </article>
          </li>)}
        </ul>
      </section>)}
      {!count && <div className={styles.empty}><Search size={36} aria-hidden="true" /><h2>{copy.empty}</h2><p>{copy.emptyHint}</p><button className="button" type="button" onClick={reset}>{copy.reset}</button></div>}
    </div>
    <a className={styles.back} href="#directory">{copy.back}<ArrowUp size={18} aria-hidden="true" /></a>
  </div>;
}
