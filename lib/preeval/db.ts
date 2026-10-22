import postgres from "postgres";
import { configuration, required, businessTableName } from "./config";
const state = globalThis as typeof globalThis & {
  preevalSql?: ReturnType<typeof postgres>;
  preevalConnection?: string;
};
export function db() {
  const config = configuration();
  const connection = required("APPLICATION_DATABASE_URL");
  if (state.preevalSql && state.preevalConnection !== connection) {
    void state.preevalSql.end({ timeout: 1 });
    state.preevalSql = undefined;
  }
  state.preevalConnection = connection;
  return (state.preevalSql ??= postgres(connection, {
    max: 5,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: !config.cloudPreview,
    connection: { statement_timeout: 15000 },
  }));
}
export type Row = Record<string, any>;
export async function audit(
  applicationId: string | null,
  actor: string,
  action: string,
  detail: Record<string, unknown> = {},
) {
  await db()`insert into ${table("preeval.audit")} (application_id,actor,action,detail) values (${applicationId},${actor},${action},${JSON.stringify(detail)}::jsonb)`;
}

/** Quote identifiers through Postgres; never interpolate request-supplied SQL. */
export function table(name: string) { return db()(businessTableName(name)); }
