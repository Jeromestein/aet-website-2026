import type { Metadata } from 'next';
import CRMPreview from '@/components/crm/crm-preview';

export const metadata: Metadata = {
  title: 'AET Workspace — CRM Preview',
  description: 'An interactive preview of the AET operations workspace, using fictional sample records.',
  robots: { index: false, follow: false },
};

export default function CRMPage() {
  return <CRMPreview />;
}
