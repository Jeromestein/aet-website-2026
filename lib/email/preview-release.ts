import 'server-only';

/** Opt in per deployment; missing or malformed values keep the gallery closed. */
export function emailPreviewEnabled() {
  return process.env.EMAIL_PREVIEW_ENABLED === 'true';
}
