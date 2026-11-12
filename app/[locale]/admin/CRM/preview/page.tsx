import { redirect } from 'next/navigation';
import { staffSession as session } from '@/lib/staff/session';
export { metadata } from '../page';
export default async function Page() {
  if ((await session())?.role !== 'admin') redirect('/admin/login');
  redirect('/admin/CRM');
}
