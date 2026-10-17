import { after } from 'next/server';
import { sameOrigin, limit } from '@/lib/preeval/auth';
import { saveIntake, requireIntakePreview } from '@/lib/application/intake-server';
import { sendIntakeEmail } from '@/lib/application/intake-email';
import { intakeBody,intakeError,intakeReply } from '@/lib/application/intake-http';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  requireIntakePreview();sameOrigin(request);
  await limit('intake:submit:'+(request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local'),30,600);
  const result=await saveIntake(await intakeBody(request));
  after(async()=>{try{await sendIntakeEmail(result.id);}catch{console.error('Intake confirmation remains queued for retry');}});
  return intakeReply(result,result.created?201:200);
 }catch(error){return intakeError(error);}
}
