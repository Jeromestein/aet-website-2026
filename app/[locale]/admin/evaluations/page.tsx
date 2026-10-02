import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { session } from '@/lib/preeval/auth';
import ApplicationShell from '@/components/evaluation-application/shell';
import { EvaluationWorkspace } from '@/components/evaluation-application/workspace';
export const metadata: Metadata = { title: 'Formal Evaluations — AET Workspace', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  return <ApplicationShell locale="en" languages={false}><EvaluationWorkspace /></ApplicationShell>;
}
