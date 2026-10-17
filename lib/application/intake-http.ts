import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../preeval/domain';
export const intakeReply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
export function intakeError(error:unknown){const status=error instanceof AppError?error.status:error instanceof ZodError?400:503;return intakeReply({error:error instanceof AppError?error.code:status===400?'invalid_request':'service_unavailable'},status);}
export async function intakeBody(request:Request,max=65536){
 const reader=request.body?.getReader();if(!reader)throw new AppError('invalid_request');
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new AppError('request_too_large',413);}chunks.push(value);}
 try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new AppError('invalid_request');}
}
