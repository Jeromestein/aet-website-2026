import { z } from "zod";

// Application IDs are the legacy customer access credential, not account IDs.
export const customerLookupSchema = z.object({
  applicationId: z.string().trim().toLowerCase().pipe(z.uuid()),
  locale: z.enum(["en", "zh", "es"]).default("en"),
}).strict();

export async function lookupApplication(applicationId: string, locale: string) {
  const response = await fetch("/api/pre-evaluation/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId, locale }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "service_unavailable");
  return data as { url: string };
}
