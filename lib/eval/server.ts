import "server-only";

export const EVAL_PROJECT = "qrxztgdemfodemlcabcq";
export const EVAL_BUCKET = "aet-eval-attachments";
export class EvalError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function isEvalEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.EVAL_LOCAL_ENABLED === "true"
  );
}
export function isLocalHost(host: string) {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(`http://${host}`).hostname,
    );
  } catch {
    return false;
  }
}
export function guard(request: Request) {
  const host = request.headers.get("host") || "";
  if (!isEvalEnabled() || !isLocalHost(host))
    throw new EvalError("Not found", 404);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new EvalError("Request not allowed", 403);
  // Next's internal request URL can use localhost even when the browser uses 127.0.0.1.
  // Compare against the validated browser Host header, including its port.
  if (
    !["GET", "HEAD"].includes(request.method) &&
    request.headers.get("origin") !== `http://${host}`
  ) {
    throw new EvalError("Request origin does not match", 403);
  }
}
export function supabaseConfig() {
  const url = process.env.EVAL_SUPABASE_URL;
  const key = process.env.EVAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url !== `https://${EVAL_PROJECT}.supabase.co`)
    throw new EvalError("Evaluation storage is not configured.", 503);
  return { url, key };
}
export async function storageFetch(path: string, init: RequestInit = {}) {
  const { url, key } = supabaseConfig();
  return fetch(`${url}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
    headers: { ...init.headers, apikey: key, Authorization: `Bearer ${key}` },
  });
}
export async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await storageFetch(`/rest/v1/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    if (failure.message === "EVAL_CONFLICT")
      throw new EvalError(
        "This report changed in another window. Reload before saving; your draft has been kept.",
        409,
      );
    if (failure.message === "EVAL_NOT_FOUND")
      throw new EvalError("Report not found.", 404);
    // Never return database details, credentials, or private report content.
    throw new EvalError(
      "The database request could not be completed. Please retry.",
      502,
    );
  }
  const body = await response.text();
  return body ? (JSON.parse(body) as T) : (undefined as T);
}
export async function bodyBytes(request: Request, max: number) {
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new EvalError("File or request is too large.", 413);
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader)
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > max) {
        await reader.cancel();
        throw new EvalError("File or request is too large.", 413);
      }
      chunks.push(value);
    }
  return Buffer.concat(chunks);
}
export async function jsonBody(request: Request) {
  try {
    return JSON.parse(
      (await bodyBytes(request, 2 * 1024 * 1024)).toString("utf8"),
    ) as unknown;
  } catch (error) {
    if (error instanceof EvalError) throw error;
    throw new EvalError("Invalid JSON.");
  }
}
export const responseHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
