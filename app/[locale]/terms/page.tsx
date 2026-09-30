import { LegalPage, legalMetadata, type LegalPageProps } from '@/components/legal/legal-page';

export const generateMetadata = (props: LegalPageProps) => legalMetadata('terms', props);

export default function TermsPage(props: LegalPageProps) {
  return <LegalPage document="terms" {...props} />;
}
