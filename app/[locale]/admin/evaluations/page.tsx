import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { session } from '@/lib/preeval/auth';
export const metadata: Metadata = { title: 'Formal Evaluations — AET Workspace', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  redirect('/admin/CRM?view=formal');
}
