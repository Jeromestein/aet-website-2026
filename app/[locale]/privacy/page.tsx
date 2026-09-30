import { LegalPage, legalMetadata, type LegalPageProps } from '@/components/legal/legal-page';

export const generateMetadata = (props: LegalPageProps) => legalMetadata('privacy', props);

export default function PrivacyPage(props: LegalPageProps) {
  return <LegalPage document="privacy" {...props} />;
}
