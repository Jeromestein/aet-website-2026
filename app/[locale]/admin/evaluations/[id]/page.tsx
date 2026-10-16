import { redirect } from 'next/navigation';
import { session } from '@/lib/preeval/auth';
export { metadata } from '../page';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  const { id } = await params;
  redirect('/admin/CRM?view=formal&kind=formal&application=' + encodeURIComponent(id));
}
