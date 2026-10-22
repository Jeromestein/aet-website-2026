import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import GPACalculator from '@/components/crm/gpa-calculator';
import StaffUnavailable from '@/components/staff/unavailable';
import { AppError } from '@/lib/preeval/domain';
import { session } from '@/lib/preeval/auth';

export const metadata: Metadata = {
  title: 'GPA Calculator | AET Workspace',
  description: 'Calculate transcript GPA using the original AET grading scale.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function GPACalculatorPage() {
  let current;
  try { current = await session(); }
  catch (error) {
    if (error instanceof AppError && error.code === 'service_unavailable') return <StaffUnavailable />;
    throw error;
  }
  if (current?.role !== 'admin') redirect('/admin/login');
  return <GPACalculator />;
}
