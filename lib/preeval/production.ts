import { environmentValue } from '../application-environment.mjs';

/** Explicit release opt-in. A Preview deployment can never become a live runtime. */
export function productionMode() {
  const requested = environmentValue('APP_ENV') === 'production' ||
    environmentValue('APPLICATION_DATABASE_MODE') === 'production' ||
    process.env.APPLICATION_CORE_MODE === 'six-production';
  if (!requested) return false;
  if (environmentValue('APP_ENV') !== 'production' ||
    environmentValue('APPLICATION_DATABASE_MODE') !== 'production' ||
    process.env.APPLICATION_CORE_MODE !== 'six-production' ||
    process.env.VERCEL !== '1' || process.env.VERCEL_ENV !== 'production' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'main' ||
    process.env.STAFF_LEGACY_MIGRATION_ENABLED !== 'false' ||
    process.env.STAFF_AUTH_CUTOVER_ENABLED !== 'false')
    throw new Error('Pre-evaluation Production requires an explicit main Production release');
  return true;
}

export function productionOrigin() {
  if (!productionMode()) throw new Error('Production runtime is not enabled');
  const url = new URL(environmentValue('APP_ORIGIN') || '');
  if (url.protocol !== 'https:' || url.port || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash ||
    !['americantranslationservice.com', 'www.americantranslationservice.com',
      'app.americantranslationservice.com'].includes(url.hostname))
    throw new Error('Production requires an approved HTTPS application origin');
  return url.origin;
}
