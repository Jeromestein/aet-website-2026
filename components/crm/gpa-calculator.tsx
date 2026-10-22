'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, Calculator, Check, Copy, RotateCcw } from 'lucide-react';
import { calculateGPA, formatGPASummary, GRADE_POINTS, type GPAIssue, type GPAResult } from '@/lib/crm/gpa';
import s from './gpa-calculator.module.css';

export default function GPACalculator() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<GPAResult | null>(null);
  const [issues, setIssues] = useState<GPAIssue[]>([]);
  const [copyStatus, setCopyStatus] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLPreElement>(null);
  const summary = result ? formatGPASummary(result) : '';
  function calculate() {
    const next = calculateGPA(input);
    setResult(next.result); setIssues(next.issues); setCopyStatus('');
    if (next.issues.length) inputRef.current?.focus();
  }
  async function copySummary() {
    try { await navigator.clipboard.writeText(summary); setCopyStatus('Copied to clipboard.'); }
    catch { setCopyStatus('Select the summary text and copy it manually.'); summaryRef.current?.focus(); }
  }
  return <div className={s.page} lang="en">
    <header className={s.header}><a href="/admin/CRM" aria-label="AET workspace"><img src="/brand/aet-logo-header.svg" width="230" height="53" alt="American Education and Translation Services,CORP (AET)" /></a><a className={s.back} href="/admin/CRM"><ArrowLeft size={16} aria-hidden="true" />Back to CRM</a></header>
    <main className={s.main}>
      <div className={s.heading}><span className={s.eyebrow}>AET WORKSPACE / TOOLS</span><h1>GPA calculator<span>.</span></h1><p>Paste your course list to calculate GPA using the original AET grading scale.</p></div>
      <div className={s.grid}>
        <section className={s.card} aria-labelledby="course-heading">
          <div className={s.cardHeading}><span className={s.icon}><Calculator size={22} aria-hidden="true" /></span><div><h2 id="course-heading">Enter course information</h2><p>One course per line. Paste directly from Excel or plain text.</p></div></div>
          <label className={s.label} htmlFor="gpa-input">Course name · Credits / Units · Grade</label>
          <p id="gpa-format" className={s.hint}>Separate columns with tabs or spaces. Course names can contain spaces.</p>
          <textarea ref={inputRef} id="gpa-input" className={s.input} value={input} maxLength={200000} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-describedby={'gpa-format' + (issues.length ? ' gpa-errors' : '')} aria-invalid={issues.length > 0} placeholder={'College English 2.50 C\nAdvanced Mathematics\t3.00\tB+'} onChange={e => { setInput(e.target.value); setResult(null); setIssues([]); setCopyStatus(''); }} />
          {issues.length > 0 && <div id="gpa-errors" className={s.errors} role="alert"><strong>Check your course information</strong><ul>{issues.slice(0, 10).map((issue, i) => <li key={i}>{issue.line > 0 ? `Line ${issue.line}: ` : ''}{issue.message}</li>)}</ul>{issues.length > 10 && <p>And {issues.length - 10} more rows to check.</p>}</div>}
          <div className={s.actions}><button className={s.primary} onClick={calculate}><Calculator size={17} aria-hidden="true" />Calculate GPA</button><button className={s.reset} disabled={!input} onClick={() => { setInput(''); setResult(null); setIssues([]); setCopyStatus(''); inputRef.current?.focus(); }}><RotateCcw size={16} aria-hidden="true" />Reset</button></div>
          <p className={s.privateNote}>Calculated in this browser. Course information is not saved to an application.</p>
          <details className={s.rules}><summary>Grading scale &amp; calculation rules</summary><div className={s.gradeScale}>{Object.entries(GRADE_POINTS).filter(([grade]) => !['WF', 'P', 'CR', 'T'].includes(grade)).map(([grade, points]) => <div key={grade}><strong>{grade}</strong><span>{points.toFixed(2)}</span></div>)}</div><p>A+ = 4.35 is the highest possible GPA. F / Fail and WF count toward GPA at 0.00.</p><p>P / Pass, CR / Credit and T count toward total credits only. They are excluded from GPA. Grades are not case-sensitive.</p><p>GPA = total grade points × their course credits, summed and divided by GPA-eligible credits.</p></details>
        </section>
        <section className={`${s.card} ${s.resultCard}`} aria-labelledby="summary-heading">
          <div className={s.summaryHeading}><h2 id="summary-heading">GPA Summary</h2><button className={s.copy} disabled={!result} onClick={copySummary}>{copyStatus.startsWith('Copied') ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}Copy summary</button></div>
          <div aria-live="polite" className={s.resultAnnouncement}>{result ? `${result.courseCount} courses · ${result.gpaCredits.toFixed(3)} GPA credits` : 'Your results will appear here.'}</div>
          {result ? <><div className={s.metrics}><div><span>Final GPA</span><strong>{result.finalGPA.toFixed(6)}</strong><small>AET scale · maximum 4.35</small></div><div><span>Total credits / units</span><strong>{result.totalCredits.toFixed(3)}</strong><small>Including credit-only grades</small></div></div>{result.gpaCredits === 0 && <p className={s.hint}>No GPA-eligible credits. GPA is shown as 0.000000, as in the original calculator.</p>}<pre ref={summaryRef} tabIndex={0} aria-label="Copyable GPA summary" className={s.summary}>{summary}</pre></> : <div className={s.empty}><Calculator size={36} strokeWidth={1.4} aria-hidden="true" /><strong>Ready when you are</strong><p>Enter your courses, then select Calculate GPA to see totals and the grade distribution.</p></div>}
          <p role="status" className={s.copyStatus}>{copyStatus}</p>
        </section>
      </div>
    </main>
  </div>;
}
