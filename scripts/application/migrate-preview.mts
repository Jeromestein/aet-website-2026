import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postgres from 'postgres';
import {configuration,CLOUD_PROJECT} from '../../lib/preeval/config';
assert.equal(configuration().cloudPreview,true,'Only the isolated cloud preview is supported');
const connection=process.env.STAFF_AUTH_DATABASE_URL;
assert.ok(connection,'Missing preview schema administrator connection');
const url=new URL(connection);
assert.ok(url.hostname===`db.${CLOUD_PROJECT}.supabase.co`||(url.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(url.username).endsWith('.'+CLOUD_PROJECT)),'Unexpected project');
const sql=postgres(connection,{prepare:false,max:1,connect_timeout:10});
try{await sql.begin(async tx=>{await tx.unsafe(await readFile(new URL('../staff/intake-preview.sql',import.meta.url),'utf8'));});for (const name of ['20261020165103_email_delivery_records.sql', '20261020173355_formal_email_delivery_records.sql']) { let emailMigration=await readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8');
emailMigration=emailMigration.replaceAll('preeval.','aet_preview_preeval.').replaceAll('evaluation.','aet_preview_evaluation.').replaceAll("table_schema='preeval'","table_schema='aet_preview_preeval'").replaceAll("table_schema='evaluation'","table_schema='aet_preview_evaluation'");
await sql.begin(async tx=>{await tx.unsafe(emailMigration);}); }
console.log('Applied isolated preview intake and email-record migrations. Production schemas are unchanged.');}finally{await sql.end();}
