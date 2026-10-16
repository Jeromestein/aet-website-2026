import {z} from 'zod';
import countries from '../legacy-application/countries.json';

const object = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
export function studyMonth(value: unknown) {
  const part = object(value);
  const month = text(part.month), year = text(part.year);
  return month && year ? `${month.padStart(2, '0')}/${year}` : year || 'Not recorded';
}
export function educationDetails(value: unknown) {
  const row = object(value), country = text(row.country_of_study);
  return {
    school: text(row.school_name) || 'Not recorded',
    country: countries.find(item => item.code === country.toUpperCase())?.labels.en || country || 'Not recorded',
    degree: text(row.degree_obtained) || 'Not recorded',
    period: `${studyMonth(row.study_start_date)} – ${studyMonth(row.study_end_date)}`,
  };
}

// Read-only display of the original aet-app FCEApplicationForm/constants.ts rates.
// These historical USD prices must not replace a saved website quote or amount due.
const rates: Record<string, Record<string, number>> = {
  foreignCredentialEvaluation: {'7day':100,'3day':150,'24hour':200,sameday:250},
  coursebyCourse: {'8day':180,'5day':210,'3day':280,'24hour':350,sameday:450},
  professionalExperience: {'21day':600,'7day':700,'3day':800},
  positionEvaluation: {'10day':300,'5day':400,'3day':500,'2day':600},
};
const serviceNames: Record<string, string> = {
  foreignCredentialEvaluation:'Educational Foreign Credential Evaluation', coursebyCourse:'Course-by-course Evaluation',
  professionalExperience:'Expert Opinion Letter', positionEvaluation:'Position Evaluation',
};
const delivery: Record<string, [string, number]> = {
  no_delivery_needed:['No Delivery Needed - Free',0],
  usps_first_class_domestic:['USPS First Class Mail (Domestic)',10],
  usps_first_class_international:['USPS First Class Mail (International)',20],
  usps_priority_domestic:['USPS Priority Mail (Domestic)',17],
  usps_express_domestic:['USPS Express Mail (Domestic)',42],
  ups_express_domestic:['UPS Express Mail (Domestic)',58],
  usps_express_international:['USPS Express Mail (International)',71],
  fedex_express_international:['FedEx Express Mail (International)',93],
};
const extras: Record<string, [string, number]> = {
  extra_copy:['Extra Hard Copy Report',20], pdf_with_hard_copy:['PDF Report with Hard Copy',20], pdf_only:['PDF Report Only (No Hard Copy)',10],
};
const quoteNames: Record<string, string> = {
  document:serviceNames.foreignCredentialEvaluation, course:serviceNames.coursebyCourse,
  expert:serviceNames.professionalExperience, position:serviceNames.positionEvaluation,
  documentAdditional:'Additional Degrees', courseAdditional:'Additional Degrees',
  reportPdf:extras.pdf_only[0], reportPaper:extras.pdf_with_hard_copy[0], reportExtra:extras.extra_copy[0],
  domesticFirst:delivery.usps_first_class_domestic[0], domesticPriority:delivery.usps_priority_domestic[0],
  domesticExpress:delivery.usps_express_domestic[0], internationalFirst:delivery.usps_first_class_international[0],
  internationalExpress:delivery.usps_express_international[0], internationalFedex:delivery.fedex_express_international[0],
};
export const quoteSchema = z.object({
  version:z.literal(1), currency:z.literal('USD'), min:z.number().int().nonnegative(), max:z.number().int().nonnegative(), needsQuote:z.boolean(),
  lines:z.array(z.object({id:z.string(),quantity:z.number().int().positive(),min:z.number().int().nonnegative(),max:z.number().int().nonnegative(),
    turnaround:z.union([z.object({kind:z.literal('businessDays'),value:z.number().int().positive()}),z.object({kind:z.literal('hours'),value:z.number().int().positive()}),z.object({kind:z.literal('sameDay')})]).optional(),
  })),
}).refine(q=>q.min<=q.max && q.lines.every(l=>l.min<=l.max) && q.lines.reduce((n,l)=>n+l.min,0)===q.min && q.lines.reduce((n,l)=>n+l.max,0)===q.max);
const usd = (value:number) => `$${value.toFixed(2)}`;
const range = (min:number,max:number) => min===max ? usd(min/100) : `${usd(min/100)}–${usd(max/100)}`;
const speedLabel = (speed:string) => speed==='sameday'?'Same Day':/^\d+day$/.test(speed)?`${parseInt(speed)} Business Days`:/^\d+hour$/.test(speed)?`${parseInt(speed)} Hours`:speed;
export type ServiceSection = {title:string; lines:string[]};

/** Build the legacy reading layout without updating or repricing the business record. */
export function serviceDetails(value: unknown) {
  const row=object(value), service=object(row.service_type), sections:ServiceSection[]=[];
  const add=(title:string,...lines:string[])=>sections.push({title,lines});
  const purpose=text(row.purpose);
  add('Purpose:',({'evaluation-education':'Evaluation - Education','evaluation-employment':'Evaluation - Employment','evaluation-uscis':'Evaluation - USCIS'} as Record<string,string>)[purpose]||purpose||'Not recorded');
  add('Service Notes:',text(row.purpose_other)||'Not provided');
  let total=0, known=true, hasSelection=false;
  const requestQuote=!!(service.translation?.required||service.customizedService?.required);
  if(service.customizedService?.required)add('Customized Service','Price Will Be Quoted Upon Request');
  const parsed=quoteSchema.safeParse(service.websiteQuote);
  const quote=parsed.success?parsed.data:null;
  if(service.websiteQuote!=null) {
    // Invalid snapshots must not silently fall back to a different historical tariff.
    if(!quote){known=false;add('Saved quote','Quote details unavailable');}
    else {
      hasSelection=quote.lines.length>0;
      for(const line of quote.lines){
        const timing=line.turnaround;
        const duration=!timing?'':timing.kind==='sameDay'?'Same Day':`${timing.value} ${timing.kind==='businessDays'?'Business Days':'Hours'}`;
        add((quoteNames[line.id]||line.id)+(line.quantity>1?` × ${line.quantity}`:''),[range(line.min,line.max),duration].filter(Boolean).join(' · '));
      }
    }
  } else {
    for(const [key,prices] of Object.entries(rates)){
      const selected=object(service[key]), speed=text(selected.firstDegree?.speed||selected.speed);
      if(!speed)continue;
      hasSelection=true;
      const price=prices[speed], degree=key==='foreignCredentialEvaluation'||key==='coursebyCourse';
      const lines=[`${degree?'First Degree: ':''}${speedLabel(speed)} - ${price===undefined?'Price not recorded':`$${price}`}`];
      if(price===undefined)known=false;else total+=price;
      const count=Number(selected.secondDegrees||0);
      if(degree&&count>0){
        const unit=key==='foreignCredentialEvaluation'?40:60;
        lines.push(`Second Degree: ${count} × $${unit} = $${count*unit}`);
        total+=count*unit;
      }
      add(serviceNames[key],...lines);
    }
  }
  if(service.translation?.required)add('Translation Service','Price Will Be Quoted Upon Request');
  if(service.websiteQuote==null){
    const method=text(row.delivery_method);
    if(method){const item=delivery[method];add('Type of Delivery',item?(method==='no_delivery_needed'?item[0]:`${item[0]} - ${usd(item[1])}`):`${method} - Price not recorded`);if(item)total+=item[1];else known=false;}
    const lines:string[]=[];
    for(const code of Array.isArray(row.additional_services)?row.additional_services:[]){
      const item=extras[code];
      if(!item){known=false;lines.push(`${code} - Price not recorded`);continue;}
      const quantity=code==='extra_copy'?Number(object(row.additional_services_quantity)[code]||0):1;
      if(!Number.isSafeInteger(quantity)||quantity<1){known=false;lines.push(`${item[0]} - Quantity not recorded`);continue;}
      total+=item[1]*quantity;
      lines.push(code==='extra_copy'?`${item[0]}: ${quantity} × ${usd(item[1])} = ${usd(item[1]*quantity)}`:`${item[0]} - ${usd(item[1])}`);
    }
    if(lines.length)add('Additional Services',...lines);
  }
  const due=row.due_amount==null||row.due_amount===''?null:Number(row.due_amount);
  const dueKnown=due!==null && Number.isFinite(due) && due>=0;
  const totalLabel=dueKnown?'Due Amount':'Estimated Total';
  const totalValue=dueKnown?usd(due):requestQuote||quote?.needsQuote?'Due amount is not set yet':!known||!hasSelection?'Not recorded':quote?range(quote.min,quote.max):usd(total);
  return {sections,totalLabel,totalValue};
}
