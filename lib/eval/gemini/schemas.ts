/**
 * Gemini API Schemas
 *
 * Contains Zod schemas for runtime validation and JSON schema for Gemini API.
 * Supports multi-stage PDF analysis:
 *   - Stage 1: Pure PDF parsing (RawCourseSchema, ParsedPdfResponseSchema)
 *   - Stage 2: Data processing with grade conversion (CourseSchema, TranscriptResponseSchema)
 */

import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

// ============================================================================
// Stage 1 Schemas - Pure PDF Parsing (no grade conversion, no usGrade/usCredits)
// ============================================================================

export const RawCourseSchema = z.object({
    year: z.string().describe("Academic year as single year only (e.g., 2015, 2016). Do NOT use ranges like 2015-2016."),
    name: z.string().describe("Course name"),
    credits: z.string().describe("Original credits as string"),
    grade: z.string().describe("Original grade received"),
    level: z.string().describe("Course level: LD, UD, or GR"),
})

export const RawCredentialSchema = z.object({
    awardingInstitution: z.string().describe("Full name of the institution in format: English Name (Original Name in Native Language)"),
    country: z.string().describe("Country of the institution"),
    program: z.string().describe("Name of the program or major"),
    admissionRequirements: z.string().describe("Admission requirements if stated, else N/A"),
    grantsAccessTo: z.string().describe("What this credential grants access to"),
    standardProgramLength: z.string().describe("Duration of the program in English words"),
    yearsAttended: z.string().describe("Start year - End year"),
    yearOfGraduation: z.string().describe("Graduation year"),
    totalYearCredits: z.string().describe("Typical total credits per academic year"),
    courses: z.array(RawCourseSchema),
})

export const ParsedPdfResponseSchema = z.object({
    isEnglish: z.boolean().describe("Whether the document is in English"),
    detectedLanguage: z.string().describe("Detected language of the document"),
    name: z.string().describe("Full name of the student"),
    dob: z.string().describe("Date of birth in format: MMM D, YYYY (e.g., Feb 2, 2022, Dec 15, 2019) or N/A"),
    country: z.string().describe("Country where the institution is located"),
    credentials: z.array(RawCredentialSchema),
    documents: z.array(z.object({
        title: z.string().describe("Document title"),
        issuedBy: z.string().describe("Issuing institution"),
        dateIssued: z.string().describe("Issue date in format: MMM D, YYYY (e.g., Feb 2, 2022) or N/A"),
        certificateNo: z.string().describe("Certificate/diploma number or N/A"),
    })),
})

// Stage 1 types
export type ParsedPdfResponse = z.infer<typeof ParsedPdfResponseSchema>
export type RawCourse = z.infer<typeof RawCourseSchema>
export type RawCredential = z.infer<typeof RawCredentialSchema>

// Stage 1 JSON Schema for Gemini API
export const parsedPdfResponseJsonSchema = zodToJsonSchema(
    ParsedPdfResponseSchema,
    { target: "openApi3" }
)

// ============================================================================
// Stage 2 Schemas - Final Output (with grade conversion, usGrade/usCredits)
// ============================================================================

export const CourseSchema = z.object({
    year: z.string().describe("Academic year as single year only (e.g., 2015, 2016). Do NOT use ranges like 2015-2016."),
    name: z.string().describe("Course name"),
    credits: z.string().describe("Original credits as string"),
    grade: z.string().describe("Original grade received"),
    usGrade: z.string().describe("Converted US grade (A, B, C, D, F)"),
    usCredits: z.string().describe("Converted US semester credits as string"),
    level: z.string().describe("Course level: LD, UD, or GR"),
    conversionSource: z.string().describe("AICE_RULES or AI_INFERRED"),
})

export const GradeConversionSchema = z.object({
    grade: z.string().describe("Original grade with descriptor in format: 'value (descriptor)' e.g., '5.0 (very good)', '4.5 (good plus)', '3.0 (satisfactory)'"),
    usGrade: z.string().describe("U.S. equivalent grade (A, B, C, D, F)"),
})

export const CredentialSchema = z.object({
    awardingInstitution: z.string().describe("Full name of the institution in format: English Name (Original Name in Native Language)"),
    country: z.string().describe("Country of the institution"),
    program: z.string().describe("Name of the program or major"),
    admissionRequirements: z.string().describe("Admission requirements if stated, else N/A"),
    grantsAccessTo: z.string().describe("What this credential grants access to"),
    standardProgramLength: z.string().describe("Duration of the program"),
    yearsAttended: z.string().describe("Start year - End year"),
    yearOfGraduation: z.string().describe("Graduation year"),
    totalYearCredits: z.string().describe("Typical total credits per academic year"),
    equivalenceStatement: z.string().describe("US equivalence statement with degree and major"),
    courses: z.array(CourseSchema),
    gradeConversion: z.array(GradeConversionSchema),
})

export const DocumentSchema = z.object({
    title: z.string().describe("Document title (e.g., Bachelor's Degree Diploma)"),
    issuedBy: z.string().describe("Issuing institution in format: English Name (Original Name in Native Language)"),
    dateIssued: z.string().describe("Issue date in format: MMM D, YYYY (e.g., Feb 2, 2022) or N/A"),
    certificateNo: z.string().describe("Certificate/diploma number or N/A"),
})

export const ReferenceSchema = z.object({
    citation: z.string().describe("APA formatted citation"),
})

export const TranscriptResponseSchema = z.object({
    isEnglish: z.boolean().describe("Whether the document is in English"),
    detectedLanguage: z.string().describe("Detected language of the document"),
    name: z.string().describe("Full name of the student"),
    dob: z.string().describe("Date of birth in format: MMM D, YYYY (e.g., Feb 2, 2022, Dec 15, 2019) or N/A"),
    country: z.string().describe("Country where the institution is located"),
    credentials: z.array(CredentialSchema),
    documents: z.array(DocumentSchema),
    references: z.array(ReferenceSchema).describe("APA formatted references for the evaluation"),
    evaluationNotes: z.string().describe("Evaluation notes including credit conversion methodology"),
})

// Stage 2 types
export type TranscriptResponse = z.infer<typeof TranscriptResponseSchema>
export type Course = z.infer<typeof CourseSchema>
export type Credential = z.infer<typeof CredentialSchema>

// Stage 2 JSON Schema for Gemini API
export const transcriptResponseJsonSchema = zodToJsonSchema(
    TranscriptResponseSchema,
    { target: "openApi3" }
)

// ============================================================================
// System Instructions
// ============================================================================

/**
 * Stage 1 Instruction: Pure PDF Parsing
 * Focus: Extract ALL data without modification, ensure completeness
 */
export const STAGE1_PDF_PARSING_INSTRUCTION = `You are an expert at extracting data from academic transcripts and diplomas.

YOUR ONLY TASK: Extract ALL information exactly as it appears in the document.

CRITICAL RULES - DO NOT SKIP ANY COURSES:
1. Extract EVERY SINGLE course listed in the document - no exceptions
2. A 3.5-4 year program typically has 40-60+ courses - you MUST extract ALL of them
3. Maintain the EXACT order as they appear in the document
4. Include courses with 0 credits (labs, seminars, training, practice)
5. Include courses with PASS/FAIL/CREDIT grades
6. Include courses in ANY language (Chinese, Russian, etc.) - keep original names
7. Do NOT summarize, merge, or skip any courses
8. Each row in the transcript = one course in the output
9. If the transcript has multiple pages, extract courses from ALL pages

COURSE LEVEL RULES:
- Years 1-2 = "LD" (Lower Division)
- Years 3-4+ = "UD" (Upper Division)
- Graduate courses = "GR"

FORMAT RULES:
1. INSTITUTION NAME: Use format "English Name (Original Name in Native Language)"
   Example: "Peking University (北京大学)", "Lublin University of Technology (Politechnika Lubelska)"
2. PROGRAM: Use format "English Name (Original Name)" when original differs from English
   Example: "Computer Science (Informatyka)", "Engineering (工程学)"
3. ORIGINAL GRADE: Preserve original descriptors in parentheses
   Example: "5.0 (very good)", "4.5 (good plus)", "очень хорошо (very good)"
4. STANDARD PROGRAM LENGTH: Use English words (e.g., "Four years", not "4 years")
5. DATE FORMAT: All dates must use format MMM D, YYYY (e.g., Feb 2, 2022, Dec 15, 2019)
6. COURSE YEAR FORMAT: Use single year only (e.g., 2015, 2016). Do NOT use ranges like 2015-2016 or 2015/2016.
7. CREDITS/GRADES: Extract exactly as shown, do not convert
8. If information is not found, use "N/A"

LANGUAGE HANDLING:
- Set isEnglish to true if document contains usable English content
- Set detectedLanguage to the primary language (e.g., "Chinese", "Russian")

DO NOT:
- Convert grades to US grades (that happens in Stage 2)
- Convert credits to US credits (that happens in Stage 2)
- Add references (that happens in Stage 2)
- Generate evaluation notes (that happens in Stage 2)
- Skip any courses for any reason`

/**
 * Stage 2 Instruction: Data Processing
 * Focus: Grade conversion, credit conversion, references, evaluation notes
 */
export const STAGE2_DATA_PROCESSING_INSTRUCTION = `You are an expert at processing academic credential data for Foreign Credential Evaluation (FCE).

You will receive parsed PDF data with original course information. Your task is to:
1. Convert grades to US equivalents
2. Convert credits to US semester credits
3. Generate grade conversion table
4. Generate equivalence statement
5. Generate evaluation notes

TOOL USAGE (MANDATORY):
1. ALWAYS call lookup_grade_conversion_batch with ALL unique grades from the courses
2. ALWAYS call lookup_references with the country

GRADE CONVERSION RULES:
1. **HIGHEST PRIORITY - DOCUMENT**: Check if the parsed document itself contains a grading scale (often on the back or bottom). If FOUND, use it as the ABSOLUTE PRIMARY source.
2. **MEDIUM PRIORITY - ONLINE CONTEXT**: If the document does NOT contain a scale, check the "Background Information on Grading System" provided (e.g., from Scholaro). If valid, use it as the SECONDARY source.
3. **LOWEST PRIORITY - INTERNAL/TOOLS**: If neither provides a scale, use the lookup tool or internal inference rules.

- If tool returns usGrade, and priorities 1 & 2 are not met, use it with conversionSource = "AICE_RULES"
- If tool returns null, infer using these rules and set conversionSource = "AI_INFERRED":
  - China (0-100): 90-100=A, 80-89=B, 70-79=C, 60-69=D, <60=F
  - Russia (1-5): 5=A, 4=B, 3=C, 2=D
  - India: 60-100=A, 50-59=B, 40-49=C, <40=F
  - UK: First=A, 2:1=B+, 2:2=B, Third=C, Pass=D, Fail=F
  - PASS/CREDIT/通过 = "P" (Pass)
  - FAIL = "F"

CREDIT CONVERSION:
- Golden Rule: 1 Academic Year = 30 US Semester Credits
- Calculate: usCredits = originalCredits * (30 / totalYearCredits)
- Round to nearest 0.5 (e.g., 1.62 → 1.50, 0.95 → 1.00)

GRADE CONVERSION TABLE:
Generate gradeConversion[] array showing the scale used:
- Format: "value (descriptor)" → "US Grade"
- Use bilingual format: "value (original_descriptor)" preserving source language descriptors
- Examples:
  - Poland: "5.0 (very good)" → "A", "4.5 (good plus)" → "B+", "3.0 (satisfactory)" → "C"
  - China: "90-100 (优秀)" → "A", "80-89 (良好)" → "B"
  - Russia: "5 (отлично)" → "A", "4 (хорошо)" → "B"

EQUIVALENCE STATEMENT:
Generate equivalenceStatement like:
- "Bachelor's degree with a major in Computer Science"
- "Four years of undergraduate study with a major in Engineering"

EVALUATION NOTES:
Generate comprehensive evaluationNotes explaining:
- Credit Conversion Methodology
- Special considerations about the institution
- Any limitations or caveats

REFERENCES:
Include ALL citations returned by lookup_references in references[] array.`

// Legacy instruction for backward compatibility
export const TRANSCRIPT_ANALYSIS_INSTRUCTION = STAGE1_PDF_PARSING_INSTRUCTION
