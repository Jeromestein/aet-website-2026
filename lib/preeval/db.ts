import postgres from "postgres";
import { configuration, required } from "./config";
const state = globalThis as typeof globalThis & {
  preevalSql?: ReturnType<typeof postgres>;
};
export function db() {
  configuration();
  return (state.preevalSql ??= postgres(required("PREEVAL_DATABASE_URL"), {
    max: 5,
    idle_timeout: 10,
    connect_timeout: 5,
  }));
}
export type Row = Record<string, any>;
export async function audit(
  applicationId: string | null,
  actor: string,
  action: string,
  detail: Record<string, unknown> = {},
) {
  await db()`insert into preeval.audit (application_id,actor,action,detail) values (${applicationId},${actor},${action},${JSON.stringify(detail)}::jsonb)`;
}
