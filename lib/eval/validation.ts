import { z } from "zod";
const text = z.string().max(30000);
const short = z.string().max(1000);
export const uuid = z.string().uuid();
const course = z
  .object({
    id: z.number().int().nonnegative(),
    year: short,
    name: text,
    level: short.default(""),
    credits: short.default(""),
    grade: short.default(""),
    usGrade: short.optional(),
    usCredits: short.optional(),
    conversionSource: short.optional(),
  })
  .passthrough();
const credential = z
  .object({
    id: z.number().int().nonnegative(),
    awardingInstitution: text,
    country: short,
    admissionRequirements: text,
    program: text,
    grantsAccessTo: text,
    standardProgramLength: short,
    yearsAttended: short,
    yearOfGraduation: short,
    equivalenceStatement: text,
    gpa: short,
    totalCredits: short,
    gradeConversion: z
      .array(z.object({ grade: short, usGrade: short }).passthrough())
      .max(100),
    courses: z.array(course).max(2000),
    courseTableNotes: text.optional(),
  })
  .passthrough();
export const ReportSchema = z
  .object({
    refNo: short,
    name: short,
    dob: short,
    country: short,
    date: short,
    purpose: text,
    documents: z
      .array(
        z
          .object({
            title: text,
            issuedBy: text,
            dateIssued: short,
            certificateNo: short,
          })
          .passthrough(),
      )
      .max(100),
    credentials: z.array(credential).min(1).max(30),
    evaluationNotes: text,
    evaluatorName: short,
    evaluatorSignature: z.string().max(400000),
    seniorEvaluatorName: short,
    seniorEvaluatorSignature: z.string().max(400000),
    references: text,
    evidence: z
      .array(
        z
          .object({
            id: short,
            path: short,
            label: short,
            value: text,
            confidence: z.enum(["high", "medium", "low"]),
            source: z.enum([
              "AICE_RULES",
              "AI_INFERRED",
              "USER_VERIFIED",
              "MANUAL",
            ]),
            refs: z.array(
              z
                .object({
                  docId: short,
                  page: z.number(),
                  quote: text,
                  method: z.enum(["pdf-text", "ocr", "ai", "manual"]),
                  bbox: z
                    .tuple([z.number(), z.number(), z.number(), z.number()])
                    .optional(),
                  extractor: short.optional(),
                  extractedAt: short.optional(),
                })
                .passthrough(),
            ),
            verifiedBy: short.optional(),
            verifiedAt: short.optional(),
            notes: text.optional(),
          })
          .passthrough(),
      )
      .max(2000)
      .optional(),
  })
  .passthrough();
export const SaveSchema = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(160),
  content: ReportSchema,
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
});
export const AssistantSchema = z.object({
  reportId: uuid,
  message: z.string().trim().min(1).max(8000),
  content: ReportSchema,
  imagePaths: z.array(z.string().max(400)).max(3).default([]),
});
