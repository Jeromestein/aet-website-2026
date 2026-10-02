export async function evaluationApi<T = Record<string, unknown>>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch('/api/evaluation/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined || body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body), signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'service_unavailable');
  return data;
}
