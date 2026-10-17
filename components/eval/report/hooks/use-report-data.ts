/**
 * useReportData - Custom hook for managing report data state
 *
 * This hook encapsulates all state management logic for the credential evaluation report,
 * including CRUD operations for credentials, courses, documents, and other data fields.
 *
 * By centralizing state management here, we achieve:
 * - Single source of truth for data mutations
 * - Cleaner component code in index.tsx
 * - Easier testing and debugging
 * - Type-safe update operations
 */

import { useState, useCallback } from "react"
import { buildSampleData, rehydrateData, type Course, type SampleData } from "@/lib/eval/report-data"
import { calculateStats } from "@/lib/eval/gpa"
import {
    TopLevelField,
    CourseField,
    CredentialField,
    GradeConversionField,
    DocumentField,
    UpdateEquivalenceField,
    UpdateCredentialField,
    UpdateGradeConversion,
    UpdateDataField,
    UpdateCourse,
    UpdateDocument,
    DeleteDocument,
} from "../types"

export type UseReportDataOptions = {
    initialData?: SampleData
    readOnly?: boolean
    initialName?: string
    initialId?: string | null
}

// Report metadata for tracking save status
export type ReportMeta = {
    id: string | null
    name: string
    isDirty: boolean
}

export type UseReportDataReturn = {
    // State
    data: SampleData
    setData: React.Dispatch<React.SetStateAction<SampleData>>

    // Report metadata
    reportMeta: ReportMeta
    setReportName: (name: string) => void
    setReportMeta: (meta: Partial<ReportMeta>) => void
    markClean: () => void

    // Update functions
    updateEquivalenceField: UpdateEquivalenceField
    updateGradeConversion: UpdateGradeConversion
    updateDataField: UpdateDataField
    updateCredentialField: UpdateCredentialField
    updateCourse: UpdateCourse
    updateDocument: UpdateDocument

    // Delete functions
    deleteDocument: DeleteDocument
    deleteCourse: (credentialIndex: number, id: number) => void

    // Add functions
    addCourse: (credentialIndex: number) => void
    addDocument: () => void

    // Utility functions
    handleReset: () => void
    rehydrate: (newData: SampleData, meta?: Partial<ReportMeta>) => void
}

export function useReportData({
    initialData,
    readOnly = false,
    initialName = "Unnamed Draft",
    initialId = null,
}: UseReportDataOptions = {}): UseReportDataReturn {
    const [data, setData] = useState<SampleData>(() => initialData ?? buildSampleData())

    // Report metadata state
    const [reportMeta, setReportMetaState] = useState<ReportMeta>({
        id: initialId,
        name: initialName,
        isDirty: false,
    })

    // -------------------------------------------------------------------------
    // Update functions
    // -------------------------------------------------------------------------

    const updateEquivalenceField: UpdateEquivalenceField = useCallback((credentialIndex, field, value) => {
        if (readOnly) return
        setReportMetaState((prev) => ({ ...prev, isDirty: true }))
        setData((prev) => ({
            ...prev,
            credentials: prev.credentials.map((cred, index) =>
                index === credentialIndex
                    ? { ...cred, [field]: value }
                    : cred
            ),
        }))
    }, [readOnly])

    const updateGradeConversion: UpdateGradeConversion = useCallback((credentialIndex, rowIndex, field, value) => {
        if (readOnly) return
        setData((prev) => ({
            ...prev,
            credentials: prev.credentials.map((cred, index) =>
                index === credentialIndex
                    ? {
                        ...cred,
                        gradeConversion: cred.gradeConversion.map((row, rIndex) =>
                            rIndex === rowIndex ? { ...row, [field]: value } : row
                        ),
                    }
                    : cred
            ),
        }))
    }, [readOnly])

    const updateDataField: UpdateDataField = useCallback((field, value) => {
        if (readOnly) return
        setReportMetaState((prev) => ({ ...prev, isDirty: true }))
        setData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }, [readOnly])

    const updateCredentialField: UpdateCredentialField = useCallback((credentialIndex, field, value) => {
        if (readOnly) return
        setData((prev) => ({
            ...prev,
            credentials: prev.credentials.map((credential, index) =>
                index === credentialIndex
                    ? { ...credential, [field]: value }
                    : credential
            ),
        }))
    }, [readOnly])

    const updateCourse: UpdateCourse = useCallback((credentialIndex, id, field, value) => {
        if (readOnly) return
        setReportMetaState((prev) => ({ ...prev, isDirty: true }))
        setData((prev) => ({
            ...prev,
            credentials: prev.credentials.map((credential, index) => {
                if (index !== credentialIndex) return credential
                const courses = credential.courses.map((course) =>
                    course.id === id ? { ...course, [field]: value } : course
                )
                const { totalCredits, gpa } = calculateStats(courses)
                return {
                    ...credential,
                    courses,
                    totalCredits,
                    gpa,
                }
            }),
        }))
    }, [readOnly])

    const updateDocument: UpdateDocument = useCallback((index, field, value) => {
        if (readOnly) return
        setData((prev) => ({
            ...prev,
            documents: prev.documents.map((document, docIndex) =>
                docIndex === index ? { ...document, [field]: value } : document
            ),
        }))
    }, [readOnly])

    // -------------------------------------------------------------------------
    // Delete functions
    // -------------------------------------------------------------------------

    const deleteDocument: DeleteDocument = useCallback((index) => {
        if (readOnly) return
        setData((prev) => ({
            ...prev,
            documents: prev.documents.filter((_, docIndex) => docIndex !== index),
        }))
    }, [readOnly])

    const deleteCourse = useCallback((credentialIndex: number, id: number) => {
        if (readOnly) return
        setData((prev) => ({
            ...prev,
            credentials: prev.credentials.map((credential, index) => {
                if (index !== credentialIndex) return credential
                const courses = credential.courses.filter((course) => course.id !== id)
                const { totalCredits, gpa } = calculateStats(courses)
                return {
                    ...credential,
                    courses,
                    totalCredits,
                    gpa,
                }
            }),
        }))
    }, [readOnly])

    // -------------------------------------------------------------------------
    // Add functions
    // -------------------------------------------------------------------------

    const addCourse = useCallback((credentialIndex: number) => {
        if (readOnly) return
        const newCourse: Course = {
            id: Date.now(),
            year: "202X",
            name: "New Course Name",
            level: "L",
            credits: "3.00",
            grade: "A",
        }

        setData((prev) => ({
            ...prev,
            credentials: prev.credentials.map((credential, index) => {
                if (index !== credentialIndex) return credential
                const courses = [...credential.courses, newCourse]
                const { totalCredits, gpa } = calculateStats(courses)
                return {
                    ...credential,
                    courses,
                    totalCredits,
                    gpa,
                }
            }),
        }))
    }, [readOnly])

    const addDocument = useCallback(() => {
        if (readOnly) return
        setReportMetaState((prev) => ({ ...prev, isDirty: true }))
        setData((prev) => ({
            ...prev,
            documents: [
                ...prev.documents,
                {
                    title: "Document Title",
                    issuedBy: "",
                    dateIssued: "",
                    certificateNo: "N/A",
                },
            ],
        }))
    }, [readOnly])

    // -------------------------------------------------------------------------
    // Report metadata functions
    // -------------------------------------------------------------------------

    const setReportName = useCallback((name: string) => {
        setReportMetaState((prev) => ({ ...prev, name, isDirty: true }))
    }, [])

    const setReportMeta = useCallback((meta: Partial<ReportMeta>) => {
        setReportMetaState((prev) => ({ ...prev, ...meta }))
    }, [])

    const markClean = useCallback(() => {
        setReportMetaState((prev) => ({ ...prev, isDirty: false }))
    }, [])

    // -------------------------------------------------------------------------
    // Utility functions
    // -------------------------------------------------------------------------

    const handleReset = useCallback(() => {
        if (readOnly) return
        if (typeof window !== "undefined" && window.confirm("Reset data to sample?")) {
            setData(buildSampleData())
            setReportMetaState({ id: null, name: "Unnamed Draft", isDirty: false })
        }
    }, [readOnly])

    const rehydrate = useCallback((newData: SampleData, meta?: Partial<ReportMeta>) => {
        setData(rehydrateData(newData))
        if (meta) {
            setReportMetaState((prev) => ({ ...prev, ...meta, isDirty: false }))
        }
    }, [])

    return {
        // State
        data,
        setData,

        // Report metadata
        reportMeta,
        setReportName,
        setReportMeta,
        markClean,

        // Update functions
        updateEquivalenceField,
        updateGradeConversion,
        updateDataField,
        updateCredentialField,
        updateCourse,
        updateDocument,

        // Delete functions
        deleteDocument,
        deleteCourse,

        // Add functions
        addCourse,
        addDocument,

        // Utility functions
        handleReset,
        rehydrate,
    }
}
