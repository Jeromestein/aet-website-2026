import {NextResponse} from 'next/server';
import {ZodError} from 'zod';
import {requireStaff} from '@/lib/staff/session';
import {AppError} from '@/lib/preeval/domain';
import {liveEnabled} from '@/lib/crm/live-db';
import {liveReference} from '@/lib/crm/live-domain';
import {liveDetail} from '@/lib/crm/live-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
type Context={params:Promise<{kind:string;id:string}>};
export async function GET(_request:Request,context:Context){
 try{
  if(!liveEnabled())throw new AppError('not_found',404);
  const staff=await requireStaff();const {kind,id}=liveReference.parse(await context.params);
  return NextResponse.json(await liveDetail(kind,id,staff),{headers});
 }catch(e){
  const code=(e as {code?:string}).code;
  const status=e instanceof AppError?e.status:e instanceof ZodError?400:['55P03','40001','40P01'].includes(code||'')?409:code==='23514'?400:503;
  return NextResponse.json({error:e instanceof AppError?e.code:status===409?'stale_version':status===400?'invalid_request':'service_unavailable'},{status,headers});
 }
}
export function POST() {
 return NextResponse.json({error:'legacy_read_only'}, {status:405, headers:{...headers,Allow:'GET'}});
}
