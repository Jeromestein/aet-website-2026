"use client";
import {useEffect,useState} from 'react';
import type {IntakeReceipt} from '@/lib/application/intake';
import {IntakeSummary} from '@/components/application/intake-receipt';
import {WorkspaceDialog,request,errorMessage} from './ui';
export default function IntakeDrawer({id,onClose}:{id:string;onClose:()=>void}){
 const [record,setRecord]=useState<IntakeReceipt|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();request<IntakeReceipt>('/api/application-intake/'+id,undefined,controller.signal).then(setRecord).catch(e=>{if(e.name!=='AbortError')setError(errorMessage(e));});return()=>controller.abort();},[id]);
 return <WorkspaceDialog open onClose={onClose} title="Test application details" drawer>{error?<p role="alert">{error}</p>:record?<IntakeSummary record={record} locale="en"/>:<p>Loading application…</p>}</WorkspaceDialog>;
}
