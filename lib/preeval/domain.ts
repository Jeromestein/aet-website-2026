import { z } from "zod";
import { isCountryCode } from "../legacy-application/countries";

export const BASE_CENTS = 1900;
// Preserve the legacy gross-up: (19 + 0.30) / (1 - 0.029).
export const TOTAL_CENTS = Math.round((BASE_CENTS + 30) / (1 - 0.029));
export const FEE_CENTS = TOTAL_CENTS - BASE_CENTS;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const locales = ["en", "zh", "es"] as const;
export type Language = (typeof locales)[number];
const text = z.string().trim().min(1).max(200);
const date = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const applicationSchema = z
  .object({
    requestId: z.uuid(),
    locale: z.enum(locales),
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    firstName: text,
    lastName: text,
    middleName: z.string().trim().max(200).default(""),
    country: text.refine(isCountryCode),
    schoolName: text,
    countryOfStudy: text.refine(isCountryCode),
    degreeObtained: text,
    startDate: date,
    endDate: date,
    terms: z.literal(true),
    uploadsPending: z.boolean().optional(),
    unified: z.object({
      contactName: z.string().trim().min(1).max(300),
      phone: z.string().trim().max(300).refine(v => /^[+\d\s().-]+$/.test(v) && /^\d{7,15}$/.test(v.replace(/\D/g, ''))),
      office: z.enum(['miami', 'la', 'sf']), pronouns: z.enum(['mr', 'ms', 'mx']),
      dateOfBirth: z.string().refine(v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v && v >= '0001-01-01' && v <= new Date().toISOString().slice(0,10))),
      notes: z.string().trim().max(3000),
    }).strict().optional(),
  })
  .strict()
  .refine((v) => v.startDate <= v.endDate, {
    message: "invalid_dates",
    path: ["endDate"],
  }).refine(v => !v.unified || v.uploadsPending === true, { message: 'uploads_must_follow_confirmation' });
export type ApplicationInput = z.infer<typeof applicationSchema>;
export const resultSchema = z
  .object({
    result: z.string().trim().min(3).max(200),
    reasoning: z.string().trim().min(10).max(2500),
  })
  .strict();
export type EvaluationResult = z.infer<typeof resultSchema>;
export function pathFor(locale: string, path: string) {
  return (locale === "en" ? "" : "/" + locale) + path;
}
export const resultPath = (locale: string, id: string) =>
  pathFor(locale, "/status") + "?applicationId=" + encodeURIComponent(id);
export function canRelease(payment: string, status: string) {
  return payment === "paid" && status !== "cancelled";
}
export function validFile(bytes: Uint8Array, type: string) {
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) return false;
  if (type === "application/pdf")
    return Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-";
  if (type === "image/png")
    return (
      Buffer.from(bytes.slice(0, 8)).toString("hex") === "89504e470d0a1a0a"
    );
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return false;
}
export class AppError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
