/**
 * Report Type Definitions
 *
 * Centralized type definitions for the report editor.
 * Re-exports data types from lib/report-data.ts and defines
 * update function signatures for type-safe data mutations.
 */

import { SampleData, Course, GradeConversionRow, CredentialDocument } from "@/lib/eval/report-data"

export type { SampleData, Course, GradeConversionRow, CredentialDocument }

export type DocumentEntry = {
    document: CredentialDocument
    index: number
}

export type TopLevelField = "refNo" | "name" | "dob" | "country" | "date" | "purpose" | "evaluationNotes" | "evaluatorName" | "evaluatorSignature" | "seniorEvaluatorName" | "seniorEvaluatorSignature" | "references"

export type CourseField = "year" | "name" | "level" | "credits" | "grade" | "usCredits" | "usGrade" | "conversionSource"

export type CredentialField = keyof Omit<SampleData["credentials"][number], "id" | "courses" | "gradeConversion">

export type GradeConversionField = keyof GradeConversionRow

export type DocumentField = keyof SampleData["documents"][number]

export type UpdateEquivalenceField = (credentialIndex: number, field: "equivalenceStatement" | "gpa" | "totalCredits", value: string) => void

export type UpdateCredentialField = (credentialIndex: number, field: CredentialField, value: string) => void

export type UpdateGradeConversion = (credentialIndex: number, rowIndex: number, field: GradeConversionField, value: string) => void

export type UpdateDataField = (field: TopLevelField, value: string) => void

export type UpdateCourse = (credentialIndex: number, id: number, field: CourseField, value: string) => void

export type UpdateDocument = (index: number, field: DocumentField, value: string) => void

export type DeleteDocument = (index: number) => void

export type UpdateCourseRow = (id: number, field: CourseField, value: string) => void
