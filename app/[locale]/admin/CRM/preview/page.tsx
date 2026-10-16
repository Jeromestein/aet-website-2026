import { redirect } from 'next/navigation';
import { session } from '@/lib/preeval/auth';
export { metadata } from '../page';
export default async function Page() {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  redirect('/admin/CRM');
}
