import { applicationPilotOrigin, cloudBusinessEnvironmentAllowed } from "../preview-environment";

export function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("Missing configuration: " + name);
  return value;
}
export const CLOUD_PROJECT = "qrxztgdemfodemlcabcq";
export const PREVIEW_ROLE = "aet_preview_runtime";
export function configuration() {
  const origin = applicationPilotOrigin();
  const database = new URL(required("PREEVAL_DATABASE_URL"));
  const cloudPreview = process.env.PREEVAL_DATABASE_MODE === "cloud-preview";
  if (cloudPreview) {
    const user = decodeURIComponent(database.username);
    const projectMatches = (database.hostname === `db.${CLOUD_PROJECT}.supabase.co` && user === PREVIEW_ROLE) ||
      (database.hostname.endsWith(".pooler.supabase.com") && user === `${PREVIEW_ROLE}.${CLOUD_PROJECT}`);
    if (!projectMatches || !cloudBusinessEnvironmentAllowed()) {
      throw new Error("Cloud preview requires the restricted project role, an approved preview origin, and disabled employee cutover.");
    }
  } else if (process.env.PREEVAL_DATABASE_MODE && process.env.PREEVAL_DATABASE_MODE !== "local") {
    throw new Error("Unknown business database mode.");
  } else if (!["localhost", "127.0.0.1"].includes(database.hostname)) {
    throw new Error("Remote business databases require explicit cloud-preview configuration.");
  }
  return { origin, cloudPreview, admin: required("PREEVAL_ADMIN_EMAIL").toLowerCase(), recipient: required("PREEVAL_TEST_EMAIL").toLowerCase() };
}
export function businessTableName(name: string) {
  const match = /^(public|preeval|evaluation)\.([a-z][a-z0-9_]*)$/.exec(name);
  if (!match) throw new Error("Invalid business table identifier");
  if (!configuration().cloudPreview) return name;
  const schemas: Record<string,string> = {public:"aet_preview_legacy",preeval:"aet_preview_preeval",evaluation:"aet_preview_evaluation"};
  return `${schemas[match[1]]}.${match[2]}`;
}
export function requireExternalServices() {
  if (configuration().cloudPreview) throw new Error("External services are disabled during cloud database acceptance.");
}
