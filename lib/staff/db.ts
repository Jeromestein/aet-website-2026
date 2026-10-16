import "server-only";
import postgres from "postgres";
import { staffConfiguration } from "./config";
const state = globalThis as typeof globalThis & {
  aetStaffSql?: ReturnType<typeof postgres>;
};
export function staffDb() {
  return (state.aetStaffSql ??= postgres(staffConfiguration().database, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    connection: { statement_timeout: 15000 },
  }));
}
