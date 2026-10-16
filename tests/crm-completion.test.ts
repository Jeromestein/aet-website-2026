import {describe,it,expect,vi} from 'vitest';
import {completionFor} from '../lib/crm/completion';
vi.mock('server-only',()=>({}));
import {liveRow} from '../lib/crm/live-server';
const now=new Date('2026-10-16T19:00:00Z');
const row=(speed='7day',paid_at='2026-10-14T16:00:00Z')=>({status:'processing',paid_at,service_type:{foreignCredentialEvaluation:{firstDegree:{speed}}}});
const calc=(r:Record<string,any>,time=now)=>completionFor('formal',r,time);
describe('estimated processing timeline',()=>{
  it('matches the legacy inclusive weekdays and Eastern cutoff',()=>{
    expect(calc(row())?.dueDate).toBe('2026-10-22');
    expect(calc(row('7day','2026-10-14T17:00:00Z'))?.dueDate).toBe('2026-10-22');
    expect(calc(row('7day','2026-10-14T17:00:01Z'))?.dueDate).toBe('2026-10-23');
  });
  it('skips weekends and handles winter Eastern time',()=>{
    expect(calc(row('3day','2026-10-17T16:00:00Z'))?.dueDate).toBe('2026-10-21');
    expect(calc(row('3day','2026-12-04T18:01:00Z'))?.dueDate).toBe('2026-12-09');
  });
  it('preserves same-day and next-day weekend rules',()=>{
    expect(calc(row('sameday'))?.dueDate).toBe('2026-10-14');
    expect(calc(row('24hour','2026-10-16T16:00:00Z'))?.dueDate).toBe('2026-10-19');
  });
  it('uses Eastern calendar days so today is not prematurely overdue',()=>{
    const r=row('3day');
    expect(calc(r,new Date('2026-10-17T03:59:00Z'))).toMatchObject({dueDate:'2026-10-16',daysRemaining:0,tone:'amber',percent:100});
    expect(calc(r,new Date('2026-10-17T04:00:00Z'))).toMatchObject({daysRemaining:-1,tone:'red',percent:100});
  });
  it('uses the actual elapsed timeline and clamps before payment or after due',()=>{
    expect(calc(row())).toMatchObject({daysRemaining:6,percent:25,tone:'green'});
    expect(calc(row(),new Date('2026-10-20T16:00:00Z'))).toMatchObject({daysRemaining:2,percent:75,tone:'amber'});
    expect(calc(row(),new Date('2026-10-01T16:00:00Z'))?.percent).toBe(0);
  });
  it('does not invent deadlines for unsupported or incomplete records',()=>{
    for(const r of [{...row(),paid_at:null},{...row(),paid_at:'invalid'},{...row(),status:'completed'},{...row(),status:'cancelled'},row('unknown'),{...row(),service_type:{translation:{required:true}}}])expect(calc(r)).toBeNull();
    for(const kind of ['preeval','external','payment'])expect(completionFor(kind,row(),now)).toBeNull();
  });
  it('uses a validated saved turnaround instead of old tariff codes',()=>{
    const r=row();
    const snapshot={version:1,currency:'USD',min:10000,max:10000,needsQuote:false,lines:[{id:'document',quantity:1,min:10000,max:10000,turnaround:{kind:'businessDays',value:3}}]};
    expect(calc({...r,service_type:{...r.service_type,websiteQuote:snapshot}})?.dueDate).toBe('2026-10-16');
    expect(calc({...r,service_type:{...r.service_type,websiteQuote:{version:99}}})).toBeNull();
  });
  it('exposes completion only through the applicable live record projection',()=>{
    expect(liveRow('formal',{id:'fixture',...row()}).completion?.dueDate).toBe('2026-10-22');
    expect(liveRow('external',{id:'fixture',...row()}).completion).toBeNull();
  });
});
