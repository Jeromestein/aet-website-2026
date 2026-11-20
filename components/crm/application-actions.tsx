"use client";
import {useEffect,useState} from 'react';
import {Check,Copy} from 'lucide-react';
import { NewWindowIcon } from './new-window-icon';
import s from './crm.module.css';

export function ApplicationActions({id,statusHref}:{id:string;statusHref?:string}) {
 const [copied,setCopied]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{setCopied(false);setFailed(false);},[id]);
 useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),2000);return()=>clearTimeout(timer);},[copied]);
 async function copy(){try{await navigator.clipboard.writeText(id);setCopied(true);setFailed(false);}catch{setFailed(true);}}
 return <div className={s.applicationActions}>
  <button type="button" onClick={copy} aria-label="Copy application ID" title="Copy application ID">{copied?<Check size={14}/>:<Copy size={14}/>}<span>{copied?'Copied':'Copy ID'}</span></button>
  {statusHref && (
    <a href={statusHref} target="_blank" rel="noopener noreferrer">
      <NewWindowIcon />
      <span>Status<span className={s.srOnly}> (opens in a new tab)</span></span>
    </a>
  )}
  <span className={s.srOnly} role="status">{copied?'Application ID copied.':''}</span>
  {failed&&<span role="alert" className={s.helperText}>Copy unavailable. Select and copy the ID above.</span>}
 </div>;
}
