import { z } from "zod";

// Application IDs are the legacy customer access credential, not account IDs.
export const customerLookupSchema = z.object({
  applicationId: z.string().trim().toLowerCase().pipe(z.uuid()),
  locale: z.enum(["en", "zh", "es"]).default("en"),
}).strict();
