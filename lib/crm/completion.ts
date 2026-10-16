import {quoteSchema} from './detail-presentation';

export type Completion = {dueDate:string; daysRemaining:number; percent:number; tone:'green'|'amber'|'red'};
const dayMs=86_400_000;
const eastern=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function localParts(date:Date) { return Object.fromEntries(eastern.formatToParts(date).map(p=>[p.type,p.value])); }
function dayNumber(parts:Record<string,string>) { return Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day))/dayMs; }
const weekend=(day:number)=>[0,6].includes(new Date(day*dayMs).getUTCDay());
const allowed:Record<string,string[]>={foreignCredentialEvaluation:['7day','3day','24hour','sameday'],coursebyCourse:['8day','5day','3day','24hour','sameday'],professionalExperience:['21day','7day','3day'],positionEvaluation:['10day','5day','3day','2day']};

/** Read-only deadline projection. Preserve legacy Eastern cutoff and weekday rules. */
export function completionFor(kind:string,row:Record<string,any>,now=new Date()):Completion|null {
  if(kind!=='formal'||['completed','cancelled'].includes(row.status)||!row.paid_at) return null;
  const paid=new Date(row.paid_at);
  if(!Number.isFinite(paid.getTime())||!Number.isFinite(now.getTime()))return null;
  const services=row.service_type;
  if(!services||typeof services!=='object')return null;
  let days=0,hours=0,sameDay=false;
  if(services.websiteQuote!=null){
    const parsed=quoteSchema.safeParse(services.websiteQuote);
    if(!parsed.success)return null;
    for(const line of parsed.data.lines){
      const t=line.turnaround;
      if(t?.kind==='businessDays')days=Math.max(days,t.value);
      if(t?.kind==='hours')hours=Math.max(hours,t.value);
      if(t?.kind==='sameDay')sameDay=true;
    }
    // Match the saved-quote reader's longest business-day service precedence.
    if(days){hours=0;sameDay=false;}else if(hours)sameDay=false;
  }else{
    for(const [key,speeds] of Object.entries(allowed)){
      const speed=services[key]?.firstDegree?.speed||services[key]?.speed;
      if(!speed)continue;
      if(!speeds.includes(speed))return null;
      if(speed==='sameday')sameDay=true;
      else if(speed==='24hour')hours=24;
      else days=Math.max(days,parseInt(speed));
    }
  }
  // Unknown or unbounded turnaround must never become an invented deadline.
  if((!days&&!hours&&!sameDay)||days>365||(hours!==0&&hours!==24))return null;
  const part=localParts(paid),paidDay=dayNumber(part);
  const afterCutoff=Number(part.hour)>13||(Number(part.hour)===13&&(Number(part.minute)>0||Number(part.second)>0));
  const start=paidDay+(afterCutoff?1:0);
  let due=start;
  if(sameDay){/* Legacy same-day processing uses the cutoff-adjusted date. */}
  else if(hours){due++;while(weekend(due))due++;}
  else {
    let remaining=days-(weekend(due)?0:1);
    while(remaining>0){due++;if(!weekend(due))remaining--;}
  }
  const today=dayNumber(localParts(now)),daysRemaining=due-today;
  // Show elapsed calendar time over this case's payment-to-deadline window,
  // not a fabricated percentage of completed evaluation work.
  const percent=due===paidDay?(today>=due?100:0):Math.round(Math.max(0,Math.min(1,(today-paidDay)/(due-paidDay)))*100);
  return {dueDate:new Date(due*dayMs).toISOString().slice(0,10),daysRemaining,percent,tone:daysRemaining<0?'red':daysRemaining<=2?'amber':'green'};
}
