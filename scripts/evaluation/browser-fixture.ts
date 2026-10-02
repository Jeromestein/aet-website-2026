// Creates a synthetic local case and one-use links for interactive verification.
// Never sends email. Links are stored only in ignored local artifacts.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { db } from '../../lib/preeval/db';
import { configuration } from '../../lib/preeval/config';
import { shipping } from '../../lib/pricing';
import { initialData } from '../../lib/evaluation-application/domain';
async function main() {
 const {origin,admin}=configuration();const sql=db();const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
 try{
  const data=initialData();Object.assign(data.client,{name:'Fictional Workflow Preview',email:'formal-preview@example.test',phone:'+1 202 555 0149',street:'123 Fictional Street',city:'Miami',region:'FL',postal:'33101',country:'United States',office:'Miami',purpose:'education'});
  data.evaluee={title:'mx',first:'Sample',middle:'',last:'Applicant',birth:'1995-02-28'};data.educations=[{school:'Fictional University',country:'Canada',degree:'Bachelor of Science',start:'2013-09',end:'2017-06'}];data.services.document.tier='standard';data.terms=true;
  const custom=process.argv.includes('--quote');
  if(custom){data.client.name='Fictional Quote Preview';data.services.translation=true;data.delivery.report='paper';data.delivery.extraCopies=2;data.delivery.shipping=shipping.find(r=>r.id.startsWith('domestic'))!.id;}
  data.notes='Synthetic browser workflow preview. Not a real application.';
  const key=randomBytes(32).toString('hex');const res=await fetch(origin+'/api/evaluation/applications',{method:'POST',headers:{origin,'content-type':'application/json','x-application-key':key},body:JSON.stringify({requestId:randomUUID(),locale:'zh',data})});if(res.status!==201)throw Error('Fixture creation failed');const {id}=await res.json();
  const customerToken=randomBytes(32).toString('hex');await sql`insert into evaluation.access_tokens(hash,application_id,expires_at) values(${hash(customerToken)},${id},now()+interval '24 hours')`;
  const adminToken=randomBytes(32).toString('base64url');await sql`insert into preeval.tokens(hash,application_id,role,email,locale,expires_at) values(${hash(adminToken)},null,'admin',${admin},'en',now()+interval '24 hours')`;
  await mkdir('output/playwright',{recursive:true});
  await writeFile(custom ? 'output/playwright/formal-quote-preview-access.json' : 'output/playwright/formal-preview-access.json',JSON.stringify({id,customer:origin+'/zh/evaluation-access#token='+customerToken,admin:origin+'/en/access#token='+adminToken,receipt:origin+'/zh/credential-evaluation-application/success?id='+id},null,2),{mode:0o600});
  await writeFile('output/playwright/formal-synthetic-document.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1sAAAAASUVORK5CYII=','base64'));
  const content='BT /F1 20 Tf 72 700 Td (SYNTHETIC TEST REPORT) Tj 0 -40 Td /F1 12 Tf (Not a real credential evaluation. For local testing only.) Tj ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
  let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((v,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${v}\nendobj\n`;});const start=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  await writeFile('formal-synthetic-report.pdf',pdf);console.log('Synthetic local browser case prepared: '+id);
 }finally{await sql.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
