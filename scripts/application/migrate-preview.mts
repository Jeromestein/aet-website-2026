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
try{await sql.begin(async tx=>{await tx.unsafe(await readFile(new URL('../staff/intake-preview.sql',import.meta.url),'utf8'));});console.log('Applied isolated preview intake migration. Production schemas are unchanged.');}finally{await sql.end();}
