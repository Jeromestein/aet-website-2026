import type {Completion} from '@/lib/crm/completion';
import s from './crm.module.css';

export default function CompletionProgress({value}:{value?:Completion|null}) {
  if(!value)return null;
  const days=Math.abs(value.daysRemaining);
  const remaining=value.daysRemaining===0?'Due today':`${days} ${days===1?'day':'days'} ${value.daysRemaining<0?'overdue':'remaining'}`;
  const warning=value.tone==='amber'?'Approaching deadline':value.tone==='red'?'Overdue':null;
  return <div className={s.completion} data-tone={value.tone}>
    {warning&&<span className={s.completionWarning}>{warning}</span>}
    <span>{remaining}</span>
    <div className={s.completionTrack} role="progressbar" aria-label="Estimated processing timeline" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value.percent} aria-valuetext={`${remaining}; estimated completion ${value.dueDate}. Elapsed time, not work completed.`} title="Elapsed time in the estimated processing period, not work completed."><span style={{width:`${value.percent}%`}}/></div>
    <span className={s.completionDate}>Est. completion <time dateTime={value.dueDate}>{value.dueDate}</time></span>
  </div>;
}
