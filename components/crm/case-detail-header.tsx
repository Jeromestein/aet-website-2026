import {label} from '@/lib/crm/contracts';
import {ApplicationActions} from './application-actions';
import {Badge,OfficeBadge} from './ui';
import s from './crm.module.css';

/** Shared presentation for live records and isolated test records. */
export function CaseDetailHeader({id,name,office,service,status,paymentStatus,caption,tabs,tab,onTab,statusHref}:{
 id:string;name:string;office:string|null;service:string;status:string;paymentStatus:string;caption:string;
 statusHref?:string;tabs:readonly string[];tab:string;onTab:(value:string)=>void;
}) {
 return <>
  <div className={s.detailIdentity}><OfficeBadge office={office} large/><div><h2>{name}</h2><p>{id}<span> · </span>{office||'Unassigned'}</p><ApplicationActions id={id} statusHref={statusHref}/></div></div>
  <div className={s.detailBadges}><Badge tone="blue">{service}</Badge><Badge>{label(status)}</Badge><Badge>{label(paymentStatus)}</Badge></div>
  <p className={s.helperText}>{caption}</p>
  <div className={s.detailTabs} role="group" aria-label="Application detail sections">{tabs.map(value=><button key={value} aria-pressed={tab===value} className={tab===value?s.detailTabActive:''} onClick={()=>onTab(value)}>{label(value)}</button>)}</div>
 </>;
}
