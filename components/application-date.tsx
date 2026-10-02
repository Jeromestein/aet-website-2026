'use client';
const words: Record<string, { year: string; month: string; day: string }> = {
  en: { year: 'Year', month: 'Month', day: 'Day' }, zh: { year: '年', month: '月', day: '日' }, es: { year: 'Año', month: 'Mes', day: 'Día' },
};
/** The legacy form uses explicit year/month/day selectors, including on mobile. */
export function ApplicationDate({ id, label, value, onChange, locale, day = false, invalid = false, required = true }: {
  id: string; label: string; value: string; onChange: (value: string) => void; locale: string; day?: boolean; invalid?: boolean; required?: boolean;
}) {
  const t = words[locale] || words.en, parts = value.split('-');
  const years = Array.from({length: new Date().getFullYear() - 1940 + 1}, (_, index) => String(new Date().getFullYear() - index));
  if (parts[0] && !years.includes(parts[0])) years.push(parts[0]);
  const fields = [
    { key: 'year' as const, choices: years },
    { key: 'month' as const, choices: Array.from({length:12}, (_, i) => String(i+1).padStart(2,'0')) },
    ...(day ? [{ key: 'day' as const, choices: Array.from({length:31}, (_, i) => String(i+1).padStart(2,'0')) }] : []),
  ];
  return <div style={{display:'flex',gap:8,minWidth:0}}>{fields.map((field,index) => <select key={field.key} id={index ? `${id}-${field.key}` : id}
    name={`${id}.${field.key}`} aria-label={`${label} — ${t[field.key]}`} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
    required={required} value={parts[index] || ''} style={{minWidth:0,flex:1}}
    onChange={event => { const next = Array.from({length:day ? 3 : 2},(_,i)=>parts[i] || ''); next[index] = event.target.value; onChange(next.join('-')); }}>
    <option value="">{t[field.key]}</option>{field.choices.map(option=><option key={option} value={option}>{option}</option>)}
  </select>)}</div>;
}
