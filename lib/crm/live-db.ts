import 'server-only';
import postgres from 'postgres';
import {CLOUD_PROJECT} from '../preeval/config';
export const LIVE_ROLE='aet_crm_runtime';
export function liveEnabled(){
 const mode=process.env.CRM_DATA_SOURCE;
 if(mode&& !['preview','live'].includes(mode))throw new Error('Unknown CRM source');
 return mode==='live';
}
const state=globalThis as typeof globalThis & {aetLiveSql?:ReturnType<typeof postgres>;aetLiveUrl?:string};
export function liveDb(){
 if(!liveEnabled()||process.env.PREEVAL_ORIGIN!=='http://localhost:3022'||process.env.STAFF_LEGACY_MIGRATION_ENABLED!=='false'||process.env.STAFF_AUTH_CUTOVER_ENABLED!=='false')throw new Error('Live CRM requires the approved local origin and unchanged employee login');
 const url=new URL(process.env.CRM_DATABASE_URL||'');const user=decodeURIComponent(url.username);
 if(!((url.hostname===`db.${CLOUD_PROJECT}.supabase.co`&&user===LIVE_ROLE)||(url.hostname.endsWith('.pooler.supabase.com')&&user===`${LIVE_ROLE}.${CLOUD_PROJECT}`)))throw new Error('Live CRM requires its restricted project role');
 if(state.aetLiveSql&&state.aetLiveUrl!==url.href){void state.aetLiveSql.end({timeout:1});state.aetLiveSql=undefined;}
 state.aetLiveUrl=url.href;
 return state.aetLiveSql??=postgres(url.href,{max:3,prepare:false,idle_timeout:10,connect_timeout:10,connection:{statement_timeout:15000}});
}
