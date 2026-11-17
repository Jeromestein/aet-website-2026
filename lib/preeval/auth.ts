import { coreTable } from '../application-core/connection';
import { sixTableMode } from '../application-core/convergence-mode';
import { compact } from '../application-core/compact-files';
import { z } from 'zod';
import { createHash } from "node:crypto";
import { table, db, type Row } from "./db";
import { AppError, resultPath } from "./domain";
import { configuration } from "./config";
import { requestMatchesApplicationOrigin } from "../preview-environment";
import { staffSession, requireStaffApplication } from "../staff/session";

export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
/** Only verified employee sessions are recognized; customer links are application-scoped. */
export async function session() {
  return await staffSession() as Row | null;
}
export async function authorize(id?: string) {
  const current = await session();
  if(compact() && !current && id && z.uuid().safeParse(id).success){
    const [app]=await db()`select id,email from ${coreTable(db(),'aet_core_applications')} where id=${id} and primary_service='pre-evaluation'`;
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
/** Reusable customer link. Legacy customer token/session storage is retired. */
export async function makeLink(
  applicationId: string | null,
  role: "customer",
  _email: string,
  locale: string,
) {
  if (role !== "customer") throw new AppError("access_denied", 403);
  if (!compact()) throw new AppError("legacy_customer_access_retired", 410);
  if (!applicationId || !z.uuid().safeParse(applicationId).success) throw new AppError("invalid_link");
  return configuration().origin + resultPath(locale, applicationId);
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
