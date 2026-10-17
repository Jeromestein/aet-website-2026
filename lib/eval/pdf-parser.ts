// Data conversion utilities for PDF analysis results
import type { SampleData, Credential, CredentialDocument, Course, GradeConversionRow } from "./report-data"

/**
 * Round a number to nearest 0.5
 */
function roundToHalf(value: number): number {
    return Math.round(value * 2) / 2
}

/**
 * Format usCredits with 0.5 rounding
 */
function formatUsCredits(rawCredits: unknown): string {
    const num = parseFloat(String(rawCredits || "0"))
    if (!Number.isFinite(num) || num < 0) return "0.00"
    return roundToHalf(num).toFixed(2)
}

/**
 * Convert parsed AI response to SampleData format
 * @param aiData - Data from Gemini API
 * @returns Partial SampleData for merging
 */
export function convertToSampleData(
    aiData: Record<string, unknown>
): Partial<SampleData> {
    const result: Partial<SampleData> = {}

    // Top-level fields
    if (typeof aiData.name === "string") {
        result.name = aiData.name
    }
    if (typeof aiData.dob === "string") {
        result.dob = aiData.dob
    }
    if (typeof aiData.country === "string") {
        result.country = aiData.country
    }

    // Credentials
    if (Array.isArray(aiData.credentials)) {
        result.credentials = aiData.credentials.map(
            (cred: Record<string, unknown>, index: number): Credential => ({
                id: index + 1,
                awardingInstitution: String(cred.awardingInstitution || "N/A"),
                country: String(cred.country || "N/A"),
                program: String(cred.program || "N/A"),
                admissionRequirements: String(cred.admissionRequirements || "N/A"),
                grantsAccessTo: String(cred.grantsAccessTo || "N/A"),
                standardProgramLength: String(cred.standardProgramLength || "N/A"),
                yearsAttended: String(cred.yearsAttended || "N/A"),
                yearOfGraduation: String(cred.yearOfGraduation || "N/A"),
                equivalenceStatement: String(cred.equivalenceStatement || ""),
                gpa: "", // Will be calculated
                totalCredits: "", // Will be calculated
                courses: Array.isArray(cred.courses)
                    ? cred.courses.map(
                        (course: Record<string, unknown>, courseIndex: number): Course => ({
                            id: (index + 1) * 1000 + courseIndex + 1,
                            year: String(course.year || ""),
                            name: String(course.name || ""),
                            level: String(course.level || "LD"),
                            credits: String(course.credits || "0"),
                            grade: String(course.grade || ""),
                            usGrade: String(course.usGrade || ""),
                            usCredits: formatUsCredits(course.usCredits),
                            conversionSource: course.conversionSource === "AICE_RULES" ? "AICE_RULES" : "AI_INFERRED",
                        })
                    )
                    : [],
                gradeConversion: Array.isArray(cred.gradeConversion)
                    ? cred.gradeConversion.map(
                        (gc: Record<string, unknown>): GradeConversionRow => ({
                            grade: String(gc.grade || ""),
                            usGrade: gc.conversionSource === "AI_INFERRED"
                                ? `${String(gc.usGrade || "")} (AI)`
                                : String(gc.usGrade || ""),
                        })
                    )
                    : [],
            })
        )
    }

    // Documents
    if (Array.isArray(aiData.documents)) {
        result.documents = aiData.documents.map(
            (doc: Record<string, unknown>): CredentialDocument => ({
                title: String(doc.title || "N/A"),
                issuedBy: String(doc.issuedBy || "N/A"),
                dateIssued: String(doc.dateIssued || "N/A"),
                certificateNo: String(doc.certificateNo || "N/A"),
            })
        )
    }

    // References - convert array of {citation} objects to bullet-point string
    if (Array.isArray(aiData.references) && aiData.references.length > 0) {
        result.references = aiData.references
            .map((ref: Record<string, unknown>) => `• ${String(ref.citation || "")}`)
            .join("\n")
    }

    // Evidence chain (optional)
    if (Array.isArray(aiData.evidence)) {
        result.evidence = aiData.evidence.map((item: Record<string, unknown>) => ({
            id: String(item.id || ""),
            path: String(item.path || ""),
            label: String(item.label || item.path || "Evidence"),
            value: String(item.value || ""),
            confidence: (item.confidence === "high" || item.confidence === "low") ? item.confidence : "medium",
            source: (item.source === "AICE_RULES" || item.source === "USER_VERIFIED" || item.source === "MANUAL")
                ? item.source
                : "AI_INFERRED",
            refs: Array.isArray(item.refs)
                ? item.refs.map((ref: Record<string, unknown>) => ({
                    docId: String(ref.docId || ""),
                    page: Number(ref.page || 0),
                    bbox: Array.isArray(ref.bbox) && ref.bbox.length === 4
                        ? [Number(ref.bbox[0]), Number(ref.bbox[1]), Number(ref.bbox[2]), Number(ref.bbox[3])]
                        : undefined,
                    quote: String(ref.quote || ""),
                    method: (ref.method === "ocr" || ref.method === "ai" || ref.method === "manual") ? ref.method : "pdf-text",
                    extractor: typeof ref.extractor === "string" ? ref.extractor : undefined,
                    extractedAt: typeof ref.extractedAt === "string" ? ref.extractedAt : undefined,
                }))
                : [],
            verifiedBy: typeof item.verifiedBy === "string" ? item.verifiedBy : undefined,
            verifiedAt: typeof item.verifiedAt === "string" ? item.verifiedAt : undefined,
            notes: typeof item.notes === "string" ? item.notes : undefined,
        }))
    }

    // Evaluation Notes
    if (typeof aiData.evaluationNotes === "string" && aiData.evaluationNotes.trim()) {
        result.evaluationNotes = aiData.evaluationNotes
    }

    return result
}
