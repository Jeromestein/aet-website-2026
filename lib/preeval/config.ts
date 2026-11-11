import { productionMode, productionOrigin } from './production';
import { environmentValue } from "../application-environment.mjs";
import { applicationPilotOrigin, cloudBusinessEnvironmentAllowed } from "../preview-environment";

export function required(name: string) {
  const value = environmentValue(name);
  if (!value) throw new Error("Missing configuration: " + name);
  return value;
}
export const CLOUD_PROJECT = "qrxztgdemfodemlcabcq";
export const PREVIEW_ROLE = "aet_preview_runtime";
export const PRODUCTION_ROLE = "aet_runtime";
export function configuration() {
  const production = productionMode();
  const origin = production ? productionOrigin() : applicationPilotOrigin();
  const database = new URL(required("APPLICATION_DATABASE_URL"));
  const cloudPreview = environmentValue("APPLICATION_DATABASE_MODE") === "cloud-preview";
  if (cloudPreview || production) {
    const role = production ? PRODUCTION_ROLE : PREVIEW_ROLE;
    const user = decodeURIComponent(database.username);
    const projectMatches = (database.hostname === `db.${CLOUD_PROJECT}.supabase.co` && user === role) ||
      (database.hostname.endsWith(".pooler.supabase.com") && user === `${role}.${CLOUD_PROJECT}`);
    if (!projectMatches || (!production && !cloudBusinessEnvironmentAllowed())) {
      throw new Error("Cloud preview requires the restricted project role, an approved preview origin, and disabled employee cutover.");
    }
  } else if (environmentValue("APPLICATION_DATABASE_MODE") && environmentValue("APPLICATION_DATABASE_MODE") !== "local") {
    throw new Error("Unknown business database mode.");
  } else if (!["localhost", "127.0.0.1"].includes(database.hostname)) {
    throw new Error("Remote business databases require explicit cloud-preview configuration.");
  }
  return { origin, cloudPreview, production,
    recipient: production ? '' : required("APPLICATION_TEST_EMAIL").trim().toLowerCase() };
}
export function businessTableName(name: string) {
  const match = /^(public|preeval|evaluation)\.([a-z][a-z0-9_]*)$/.exec(name);
  if (!match) throw new Error("Invalid business table identifier");
  const config = configuration();
  if (config.production) throw new Error('Production only supports the six-table pre-evaluation runtime');
  if (!config.cloudPreview) return name;
  const schemas: Record<string,string> = {public:"aet_preview_legacy",preeval:"aet_preview_preeval",evaluation:"aet_preview_evaluation"};
  return `${schemas[match[1]]}.${match[2]}`;
}
export function requireExternalServices() {
  if (configuration().cloudPreview || configuration().production) throw new Error("External services are disabled during cloud database acceptance.");
}
