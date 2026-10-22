import { environmentValue } from "../../../lib/application-environment.mjs";
import { redirect } from 'next/navigation';
import { pathFor } from '@/lib/preeval/domain';
export const dynamic = 'force-dynamic';
export default async function Apply({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(environmentValue("APP_ENV") === 'local'
    ? pathFor(locale, '/credential-evaluation-application')
    : 'https://app.americantranslationservice.com/credential-evaluation-application');
}
