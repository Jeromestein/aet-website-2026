import { redirect } from 'next/navigation';
import { session } from '@/lib/preeval/auth';
import ApplicationShell from '@/components/evaluation-application/shell';
import { EvaluationCase } from '@/components/evaluation-application/workspace';
export { metadata } from '../page';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  const { id } = await params;
  return <ApplicationShell locale="en" languages={false}><EvaluationCase id={id} /></ApplicationShell>;
}
