import { z } from 'zod';
import { requireStaffApplication } from '@/lib/staff/session';
import { readIntake,requireIntakePreview } from '@/lib/application/intake-server';
import { sendIntakeEmail } from '@/lib/application/intake-email';
import { sameOrigin,limit } from '@/lib/preeval/auth';
import { intakeReply,intakeError } from '@/lib/application/intake-http';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){try{requireIntakePreview();const id=z.uuid().parse((await params).id);await requireStaffApplication('formal',id);return intakeReply(await readIntake(id));}catch(e){return intakeError(e);}}
// Application ID is the existing customer bearer credential; destination and message cannot be changed.
export async function POST(request:Request,{params}:Context){try{requireIntakePreview();sameOrigin(request);const id=z.uuid().parse((await params).id);await limit('intake:retry:'+id,3,60);await readIntake(id);await sendIntakeEmail(id);return intakeReply(await readIntake(id));}catch(e){return intakeError(e);}}
