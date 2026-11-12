import { NextResponse } from 'next/server';
import { environmentValue } from './application-environment.mjs';
import { applicationPilotOrigin } from './preview-environment';

/** Fail closed on hosted/unknown environments. This flag never configures providers. */
export function applicationsEnabled() {
  if (process.env.APPLICATIONS_ENABLED === 'false') return false;
  if (process.env.VERCEL_ENV === 'production') {
    return process.env.VERCEL === '1' && process.env.VERCEL_GIT_COMMIT_REF === 'main' &&
      process.env.APPLICATIONS_ENABLED === 'true' && environmentValue('APP_ENV') === 'production';
  }
  try { applicationPilotOrigin(); return true; } catch { return false; }
}

export function legacyApplicationUrl(preEvaluation = false) {
  return 'https://app.americantranslationservice.com/' +
    (preEvaluation ? 'degree-equivalency-tool' : 'credential-evaluation-application');
}

export function applicationUnavailableResponse() {
  if (applicationsEnabled()) return null;
  return NextResponse.json({ error: 'application_unavailable' }, { status: 503, headers: {
    'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
  } });
}
