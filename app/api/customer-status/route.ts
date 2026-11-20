import { compact } from '@/lib/application-core/compact-files';
import { coreTable } from '@/lib/application-core/connection';
import { applicationUnavailableResponse } from '@/lib/application-release';
import { productionMode } from '@/lib/preeval/production';
import {formalCore,formalLegacy,formalApplication,formalPayments} from '@/lib/application-core/formal-store';
import { withDocuments } from '@/lib/customer-status/documents';
import { readIntake } from '@/lib/application/intake-server';
import { NextResponse } from 'next/server';
import { liveDb, liveEnabled } from '@/lib/crm/live-db';
import { db, table } from '@/lib/preeval/db';
import { sameOrigin, limit } from '@/lib/preeval/auth';
import { AppError } from '@/lib/preeval/domain';
import { statusLookup, projectStatus, projectIntakeStatus } from '@/lib/customer-status/model';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer',
} });
export async function POST(request: Request) {
  const unavailable = applicationUnavailableResponse(); if (unavailable) return unavailable;

  try {
    sameOrigin(request);
    await limit('formal-status:global', 200, 600);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    await limit('formal-status:' + ip, 30, 600);
    const reader = request.body?.getReader();
    if (!reader) throw new AppError('invalid_application_id');
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.length;
      if (length > 512) { await reader.cancel(); throw new AppError('request_too_large', 413); }
      chunks.push(value);
    }
    let raw: unknown;
    try { raw = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new AppError('invalid_application_id'); }
    const parsed = statusLookup.safeParse(raw);
    if (!parsed.success) throw new AppError('invalid_application_id');
    const id = parsed.data.applicationId;
    let unifiedFormal = false;
    if (compact()) {
      const sql = db();
      const [application] = await sql`select primary_service, submission_version from ${coreTable(sql,'aet_core_applications')} where id=${id}`;
      if (application?.primary_service === 'pre-evaluation') return reply({kind: 'pre-evaluation', id});
      unifiedFormal = application?.primary_service === 'evaluation' && application.submission_version === 2 && formalCore();
    }
    if(unifiedFormal || new URL(request.url).searchParams.get('source')==='preview' || (productionMode() && !liveEnabled())) {
      const record=projectIntakeStatus(await readIntake(id));
      if(formalCore()) {
        const a=await formalApplication(id,false);
        const [payment]=await db()`select max(paid_at) paid from (${formalPayments(db())}) p where application_id=${id} and status='paid'`;
        record.status=a.status;record.payment=a.payment_status;record.amount=a.total;record.paid=payment.paid?new Date(payment.paid).toISOString():'';
        const report=a.files.find((f:{kind:string})=>f.kind==='report');
        record.workflow={production:productionMode(),canPay:!['cancelled','completed'].includes(a.status)&&['unpaid','pending'].includes(a.payment_status)&&a.total>0,message:a.customer_message,confirmedQuote:a.confirmed_quote,report:report?{id:report.id,name:report.name}:null};
      }
      return reply(withDocuments(record));
    }
    if(!liveEnabled()&&formalCore()){const {row,educations}=await formalLegacy(id);return reply(withDocuments(projectStatus(row,educations,'preview')));}
    // Older formal applications keep their original data source.
    const rows = liveEnabled()
      ? await liveDb()`select id,status,payment_status,created_at,submitted_at,paid_at,office,service_type,due_amount,name,country,street_address,street_address2,city,region,zip_code,phone,fax,email,purpose,purpose_other,first_name,middle_name,last_name,date_of_birth,pronouns from public.fce_applications where id=${id}`
      : await db()`select id,status,payment_status,created_at,submitted_at,paid_at,office,service_type,due_amount,name,country,street_address,street_address2,city,region,zip_code,phone,fax,email,purpose,purpose_other,first_name,middle_name,last_name,date_of_birth,pronouns from ${table('public.fce_applications')} where id=${id}`;
    if (!rows[0]) throw new AppError('not_found', 404);
    // Match the legacy join by application_id; return only customer education fields.
    const educations = liveEnabled()
      ? await liveDb()`select id,country_of_study,degree_obtained,school_name,study_start_date,study_end_date from public.fce_educations where application_id=${id} order by id`
      : await db()`select id,country_of_study,degree_obtained,school_name,study_start_date,study_end_date from ${table('public.fce_educations')} where application_id=${id} order by id`;
    const submitted = rows[0].submitted_at || rows[0].created_at;
    return reply(withDocuments(projectStatus(rows[0], educations, liveEnabled()?'live':'preview'),
      submitted instanceof Date ? submitted.toISOString() : String(submitted || '')));
  } catch (error) {
    return error instanceof AppError ? reply({ error: error.code }, error.status) : reply({ error: 'service_unavailable' }, 503);
  }
}
