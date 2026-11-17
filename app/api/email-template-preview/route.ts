/** Preserve local bookmarks without maintaining a second, public gallery. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 });
  const url = new URL(request.url);
  url.pathname = '/admin/email-preview';
  url.searchParams.delete('raw');
  return new Response(null, { status: 307, headers: { Location: url.toString(), 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
