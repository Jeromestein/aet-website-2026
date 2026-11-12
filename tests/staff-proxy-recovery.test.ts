import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { refreshStaff } from '../lib/staff/proxy';

const createClient = vi.hoisted(() => vi.fn());
vi.mock('@supabase/ssr', () => ({ createServerClient: createClient }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it('keeps an existing staff cookie intact when authentication is unconfigured', async () => {
  vi.stubEnv('SUPABASE_URL', undefined);
  const request = new NextRequest('http://localhost:3021/admin/CRM', {
    headers: { cookie: 'aet_staff_auth.0=synthetic-existing-cookie' },
  });
  const finish = await refreshStaff(request);
  const response = finish(NextResponse.next());
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('set-cookie')).toBeNull();
  expect(request.cookies.get('aet_staff_auth.0')?.value).toBe('synthetic-existing-cookie');
  expect(createClient).not.toHaveBeenCalled();
});
