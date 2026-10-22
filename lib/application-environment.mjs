// Shared by server code and standalone Node scripts. Never copy resolved secrets to clients.
const legacyNames = new Map([
  ["APP_ENV", "PREEVAL_ENV"],
  ["APP_ORIGIN", "PREEVAL_ORIGIN"],
  ["APPLICATION_DATABASE_MODE", "PREEVAL_DATABASE_MODE"],
  ["APPLICATION_DATABASE_URL", "PREEVAL_DATABASE_URL"],
  ["APPLICATION_TEST_EMAIL", "PREEVAL_TEST_EMAIL"],
  ["DROPBOX_LEGACY_PILOT_ROOT", "PREEVAL_DROPBOX_ROOT"],
]);

/**
 * Read at call time so environment reloads and test overrides remain effective.
 * Only an absent new variable falls back; an explicit empty value stays empty.
 * No process.env mutation or cross-service credential fallback is performed.
 * @param {string} name
 * @returns {string | undefined}
 */
export function environmentValue(name) {
  const value = process.env[name];
  const legacy = legacyNames.get(name);
  return value ?? (legacy ? process.env[legacy] : undefined);
}
