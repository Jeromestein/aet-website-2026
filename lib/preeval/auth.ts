import { sixTableMode } from '../application-core/convergence-mode';
import { compact } from '../application-core/compact-files';
import { z } from 'zod';
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { table, db, type Row } from "./db";
import { AppError, resultPath } from "./domain";
import { configuration } from "./config";
import { requestMatchesApplicationOrigin } from "../preview-environment";
import { staffSession, requireStaffApplication } from "../staff/session";

export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(32).toString("base64url");
export const COOKIE = "aet_preeval_session";
export async function session() {
  const staff = await staffSession();
  if (staff) return staff as Row;
  if(compact())return null;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !/^[\w-]{43}$/.test(value)) return null;
  const [row] =
    await db()`select * from ${table("preeval.sessions")} where hash=${hash(value)} and role='customer' and expires_at>now()`;
  return row?.role === "customer" ? row : null;
}
export async function authorize(id?: string) {
  const current = await session();
  if(compact() && !current && id && z.uuid().safeParse(id).success){
    const [app]=await db()`select id,email from aet.aet_core_applications where id=${id} and primary_service='pre-evaluation'`;
    if(app)return {role:'customer',application_id:id,email:app.email};
  }
  if (
    !current ||
    (id
      ? current.role !== "admin" && current.application_id !== id
      : current.role !== "admin")
  )
    throw new AppError("access_denied", 401);
  if (id && current.role === "admin" && current.offices) await requireStaffApplication("preeval", id);
  return current;
}
export async function makeSession(
  applicationId: string | null,
  role: "customer",
  email: string,
) {
  if (role !== "customer") throw new AppError("access_denied", 403);
  if(compact())throw new AppError('sessions_retired',410);
  const token = secret();
  await db()`insert into ${table("preeval.sessions")}(hash,application_id,role,email,expires_at) values (${hash(token)},${applicationId},${role},${email},now()+interval '24 hours')`;
  return token;
}
export function sessionCookie(value: string) {
  return {
    name: COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: configuration().origin.startsWith("https:"),
    path: "/",
    maxAge: 86400,
  };
}
export async function makeLink(
  applicationId: string | null,
  role: "customer",
  email: string,
  locale: string,
) {
  if (role !== "customer") throw new AppError("access_denied", 403);
  if(compact()){if(!applicationId||!z.uuid().safeParse(applicationId).success)throw new AppError('invalid_link');return configuration().origin+resultPath(locale,applicationId);}
  const token = secret();
  await db()`insert into ${table("preeval.tokens")}(hash,application_id,role,email,locale,expires_at) values (${hash(token)},${applicationId},${role},${email},${locale},now()+interval '24 hours')`;
  return (
    configuration().origin +
    ((locale === "en" ? "" : "/" + locale) + "/access") +
    "#token=" +
    token
  );
}
export async function consumeLink(token: string) {
  if(compact())throw new AppError("legacy_link_retired",410);
  if (!/^[\w-]{43}$/.test(token)) throw new AppError("invalid_link");
  const raw = secret();
  const row = await db().begin(async (sql) => {
    const [t] =
      await sql`update ${table("preeval.tokens")} set consumed_at=now() where hash=${hash(token)} and role='customer' and consumed_at is null and expires_at>now() returning *`;
    if (!t || t.role !== "customer") throw new AppError("invalid_link");
    await sql`insert into ${table("preeval.sessions")}(hash,application_id,role,email,expires_at) values (${hash(raw)},${t.application_id},${t.role},${t.email},now()+interval '24 hours')`;
    return t;
  });
  return { token: raw, row: row as Row };
}
export function sameOrigin(request: Request) {
  if (!requestMatchesApplicationOrigin(request.headers.get("origin"), configuration().origin))
    throw new AppError("access_denied", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new AppError("access_denied", 403);
}
export async function limit(key: string, max = 5, seconds = 600) {
  if (sixTableMode(db())) return;
  const [row] =
    await db()`insert into ${table("preeval.rate_limits")}(key,count,expires_at) values (${hash(key)},1,now()+${seconds}*interval '1 second')
    on conflict(key) do update set count=case when ${table("preeval.rate_limits")}.expires_at<now() then 1 else ${table("preeval.rate_limits")}.count+1 end,
    expires_at=case when ${table("preeval.rate_limits")}.expires_at<now() then excluded.expires_at else ${table("preeval.rate_limits")}.expires_at end returning count`;
  if (row.count > max) throw new AppError("too_many_requests", 429);
}
