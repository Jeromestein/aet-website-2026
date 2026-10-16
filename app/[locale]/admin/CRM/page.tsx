import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CRMWorkspace from '@/components/crm/workspace';
import { session } from '@/lib/preeval/auth';
import type { WorkspaceView, CaseReference } from '@/lib/crm/contracts';
import { z } from 'zod';

export const metadata: Metadata = { title: 'AET Workspace', description: 'Manage applications and client services.', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function CRMPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  const query = await searchParams;
  const view = z.enum(['applications','formal','equivalency','payments','documents']).catch('applications').parse(query.view) as WorkspaceView;
  const target = z.object({ id: z.uuid(), kind: z.enum(['formal','preeval']) }).safeParse({ id: query.application, kind: query.kind });
  return <CRMWorkspace initialView={view} initialCase={target.success ? target.data as CaseReference : null} />;
}
