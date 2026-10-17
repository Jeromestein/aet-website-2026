import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import StaffUnavailable from '@/components/staff/unavailable';
import { AppError } from '@/lib/preeval/domain';
import CRMWorkspace from '@/components/crm/workspace';
import { session } from '@/lib/preeval/auth';
import type { WorkspaceView, CaseReference } from '@/lib/crm/contracts';
import { z } from 'zod';

export const metadata: Metadata = { title: 'AET Workspace', description: 'Manage applications and client services.', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function CRMPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let current;
  try { current = await session(); }
  catch (error) {
    if (error instanceof AppError && error.code === 'service_unavailable') return <StaffUnavailable/>;
    throw error;
  }
  if (current?.role !== 'admin') redirect('/admin/login');
  const query = await searchParams;
  const view = z.enum(['applications','formal','equivalency','payments','documents']).catch('applications').parse(query.view) as WorkspaceView;
  const target = z.object({ id: z.uuid(), kind: z.enum(['formal','preeval']) }).safeParse({ id: query.application, kind: query.kind });
  return <CRMWorkspace preview={query.source==='preview'} initialView={view} initialCase={target.success ? target.data as CaseReference : null} />;
}
