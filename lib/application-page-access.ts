import 'server-only';
import { redirect } from 'next/navigation';
import { applicationsEnabled, legacyApplicationUrl } from './application-release';

export function requireApplicationPage(preEvaluation = false) {
  if (!applicationsEnabled()) redirect(legacyApplicationUrl(preEvaluation));
}
