"use client";
import {RotateCcw, LockKeyhole} from 'lucide-react';
import PreEvaluationShell from '@/components/preeval/shell';
import s from './auth.module.css';

export default function StaffUnavailable() {
  return <PreEvaluationShell locale="en" narrow staff>
    <section className={s.card} aria-labelledby="staff-unavailable-title">
      <div className={s.eyebrow}><LockKeyhole size={15}/>AET STAFF</div>
      <h1 id="staff-unavailable-title">Unable to connect</h1>
      <p className={s.intro} role="status">We couldn’t connect to the workspace. Please try again in a moment. You don’t need to reset your password.</p>
      <button className={s.submit} onClick={() => window.location.reload()}>Try again<RotateCcw size={17}/></button>
    </section>
  </PreEvaluationShell>;
}
