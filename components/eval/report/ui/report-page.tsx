/**
 * ReportPage - Single page layout component for printable reports
 *
 * This component provides the layout for a single page in the credential evaluation report.
 *
 * **Page Size: US Letter (8.5" × 11" / 215.9mm × 279.4mm)**
 *
 * This is the standard paper size used in the United States, Canada, and other countries
 * that follow the ANSI paper size standard. It differs from the ISO A4 size (210mm × 297mm)
 * which is used in most other countries.
 *
 * The page includes:
 * - Header with company logo and contact information
 * - Watermark (background image)
 * - Main content area (flex-grow)
 * - Footer with page numbers
 *
 * Print-specific styles are applied via CSS:
 * - Page breaks between pages (except the last page)
 * - Shadow removal for print media
 */

import { RefObject } from "react"
import { type Course, type SampleData } from "@/lib/eval/report-data"

import { Header } from "../sections/header"
import { Footer } from "../sections/footer"
import { Watermark } from "../sections/watermark"
import { ApplicantInfo } from "../sections/applicant-info"
import { EquivalenceSummary } from "../sections/equivalence-summary"
import { DocumentsList } from "../sections/documents-list"
import { CredentialDetails } from "../sections/credential-details"
import { CourseTable } from "../sections/course-table"
import { GradeConversion } from "../sections/grade-conversion"
import { References } from "../sections/references"
import { Notes } from "../sections/notes"
import { Signatures } from "../sections/signatures"
import { Seal } from "../sections/seal"
import { AboutAetPage } from "../sections/about-aet-page"
import { SectionTitle, ReportTitle } from "./shared"
import {
    DocumentEntry,
    CourseField,
    UpdateEquivalenceField,
    UpdateCredentialField,
    UpdateGradeConversion,
    UpdateDataField,
    UpdateCourse,
    UpdateDocument,
    DeleteDocument,
} from "../types"

export type ReportPageProps = {
    pageIndex: number
    totalPages: number
    data: SampleData
    credentialIndex?: number
    documents: DocumentEntry[]
    documentsHeading?: string
    showCredentialHeading: boolean
    showDocumentsHeading: boolean
    showDocumentsActions: boolean
    showApplicantInfo: boolean
    showCredentialTable: boolean
    showCourseSection: boolean
    showGradeConversion: boolean
    showTotals: boolean
    showSignatures: boolean
    showAboutPage: boolean
    pageCourses: Course[]
    isLastPage: boolean
    updateEquivalenceField: UpdateEquivalenceField
    updateDataField: UpdateDataField
    updateCredentialField: UpdateCredentialField
    updateCourse: UpdateCourse
    updateGradeConversion: UpdateGradeConversion
    deleteCourse: (credentialIndex: number, id: number) => void
    updateDocument: UpdateDocument
    addDocument: () => void
    addCourse: (credentialIndex: number) => void
    deleteDocument: DeleteDocument
    readOnly: boolean
    introContentRef?: RefObject<HTMLDivElement | null>
    courseContentRef?: RefObject<HTMLDivElement | null>
    tableStartRef?: RefObject<HTMLDivElement | null>
    tableHeaderRef?: RefObject<HTMLTableSectionElement | null>
    rowRef?: RefObject<HTMLTableRowElement | null>
    documentsListRef?: RefObject<HTMLUListElement | null>
    documentItemRef?: RefObject<HTMLLIElement | null>
    tailRef?: RefObject<HTMLDivElement | null>
}

export function ReportPage({
    pageIndex,
    totalPages,
    data,
    credentialIndex,
    documents,
    documentsHeading,
    showCredentialHeading,
    showDocumentsHeading,
    showDocumentsActions,
    showApplicantInfo,
    showCredentialTable,
    showCourseSection,
    showGradeConversion,
    showTotals,
    showSignatures,
    showAboutPage,
    pageCourses,
    isLastPage,
    updateEquivalenceField,
    updateDataField,
    updateCredentialField,
    updateCourse,
    updateGradeConversion,
    deleteCourse,
    updateDocument,
    addDocument,
    addCourse,
    deleteDocument,
    readOnly,
    introContentRef,
    courseContentRef,
    tableStartRef,
    tableHeaderRef,
    rowRef,
    documentsListRef,
    documentItemRef,
    tailRef,
}: ReportPageProps) {
    const credential = typeof credentialIndex === "number" ? data.credentials[credentialIndex] : undefined
    const credentialHasCourses = Boolean(credential?.courses.length)
    const showCourseTable = pageCourses.length > 0 || (!credentialHasCourses && showCourseSection)

    // Calculate dynamic section numbers
    // 1. Summary
    // 2. Documents
    // 3+. Credentials...
    const baseSectionNumber = 3
    const credentialSectionIndex = typeof credentialIndex === "number" ? credentialIndex : 0

    const credentialDetailsNum = baseSectionNumber + (credentialSectionIndex * 3)
    const courseAnalysisNum = credentialDetailsNum + 1
    const gradeConversionNum = credentialDetailsNum + 2

    const totalSections = baseSectionNumber + (data.credentials.length * 3)
    const referencesNum = totalSections
    const notesNum = totalSections + 1

    const handleUpdateCourse = (id: number, field: CourseField, value: string) => {
        if (credentialIndex === undefined) return
        updateCourse(credentialIndex, id, field, value)
    }
    const handleDeleteCourse = (id: number) => {
        if (credentialIndex === undefined) return
        deleteCourse(credentialIndex, id)
    }

    const setContentRef = (node: HTMLDivElement | null) => {
        if (courseContentRef) {
            courseContentRef.current = node
        }
        if (introContentRef) {
            introContentRef.current = node
        }
    }

    return (
        <>
            {/* US Letter (8.5" × 11") page layout and print styles */}
            <style>{`
                :root {
                    --page-width: 8.5in;
                    --page-height: 11in;
                    --page-padding: 0.45in 0.6in;
                    --page-header-height: 0.7in;
                    --page-footer-height: 0.5in;
                    --page-gap: 0.4in;
                }

                .report-page {
                    width: var(--page-width);
                    height: var(--page-height);
                    padding: var(--page-padding);
                    box-sizing: border-box;
                }

                .page-stack {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--page-gap);
                }

                .report-header {
                    height: var(--page-header-height);
                }

                .report-footer {
                    height: var(--page-footer-height);
                }

                @media print {
                    @page {
                        size: 8.5in 11in;
                        margin: 0;
                    }

                    body {
                        margin: 0;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                        background-color: white !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .page-stack {
                        display: block;
                        gap: 0 !important;
                    }

                    input::placeholder,
                    textarea::placeholder {
                        color: transparent;
                    }
                }
            `}</style>
            <div
                className="report-page shadow-xl print:shadow-none bg-white relative flex flex-col"
                style={{
                    breakAfter: isLastPage ? "auto" : "page",
                    pageBreakAfter: isLastPage ? "auto" : "always",
                    overflow: "hidden",
                }}
            >
                <Header />

                {/* Watermark in page center */}
                <Watermark />

                <div className="flex-1 min-h-0 overflow-hidden flex flex-col" ref={setContentRef}>
                    {showApplicantInfo && (
                        <>
                            <ReportTitle>
                                Credential Evaluation Report
                            </ReportTitle>

                            <ApplicantInfo data={data} updateDataField={updateDataField} readOnly={readOnly} />

                            <EquivalenceSummary
                                data={data}
                                updateEquivalenceField={updateEquivalenceField}
                                updateCredentialField={updateCredentialField}
                                readOnly={readOnly}
                            />

                        </>
                    )}

                    <DocumentsList
                        documents={documents}
                        documentsHeading={documentsHeading}
                        showDocumentsHeading={showDocumentsHeading}
                        showDocumentsActions={showDocumentsActions}
                        updateDocument={updateDocument}
                        deleteDocument={deleteDocument}
                        addDocument={addDocument}
                        readOnly={readOnly}
                        documentsListRef={documentsListRef}
                        documentItemRef={documentItemRef}
                    />

                    {/* Credential Content */}
                    {credential && (
                        <>
                            {showCredentialHeading && (
                                <SectionTitle>
                                    {credentialDetailsNum}. Credential Details: <span className="text-gray-600 normal-case ml-1">Credential #{(credentialIndex ?? 0) + 1}</span>
                                </SectionTitle>
                            )}

                            {showCredentialTable && (
                                <CredentialDetails
                                    credential={credential}
                                    credentialIndex={credentialIndex}
                                    showCredentialTable={true}
                                    updateCredentialField={updateCredentialField}
                                    readOnly={readOnly}
                                />
                            )}

                            {showCourseSection && (
                                <>
                                    <SectionTitle>{courseAnalysisNum}. Course-by-Course Analysis: <span className="text-gray-600 normal-case ml-1">Credential #{(credentialIndex ?? 0) + 1}</span></SectionTitle>
                                    <div ref={tableStartRef} />
                                </>
                            )}

                            {showCourseTable && (
                                <CourseTable
                                    courses={pageCourses}
                                    updateCourse={handleUpdateCourse}
                                    deleteCourse={handleDeleteCourse}
                                    readOnly={readOnly}
                                    headerRef={tableHeaderRef}
                                    rowRef={rowRef}
                                    showEmptyState={!credentialHasCourses}
                                    showTotals={showTotals}
                                    totalCredits={credential?.totalCredits}
                                    gpa={credential?.gpa}
                                    onUpdateTotalCredits={(value) => updateEquivalenceField(credentialIndex!, "totalCredits", value)}
                                    onUpdateGpa={(value) => updateEquivalenceField(credentialIndex!, "gpa", value)}
                                    onAddCourse={() => addCourse(credentialIndex!)}
                                    notes={credential?.courseTableNotes}
                                    onUpdateNotes={(value) => updateCredentialField(credentialIndex!, "courseTableNotes", value)}
                                    showNotes={showTotals}
                                />
                            )}
                            {showGradeConversion && (
                                <>
                                    <SectionTitle>{gradeConversionNum}. Grade Conversion: <span className="text-gray-600 normal-case ml-1">Credential #{(credentialIndex ?? 0) + 1}</span></SectionTitle>
                                    <GradeConversion
                                        rows={credential.gradeConversion}
                                        onUpdate={(rowIndex, field, value) => updateGradeConversion(credentialIndex!, rowIndex, field, value)}
                                        readOnly={readOnly}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {showSignatures && (
                        <div className="mt-4" ref={tailRef}>
                            <SectionTitle>{referencesNum}. References</SectionTitle>
                            <References references={data.references} updateDataField={updateDataField} readOnly={readOnly} />

                            <Notes
                                evaluationNotes={data.evaluationNotes}
                                updateDataField={updateDataField}
                                readOnly={readOnly}
                                sectionNum={notesNum}
                            />
                            <Signatures data={data} updateDataField={updateDataField} readOnly={readOnly} />
                            {/* <Seal /> */}
                        </div>
                    )}

                    {showAboutPage && (
                        <AboutAetPage
                            evaluatorName={data.evaluatorName}
                            seniorEvaluatorName={data.seniorEvaluatorName}
                        />
                    )}
                </div>

                <Footer pageIndex={pageIndex} totalPages={totalPages} refNo={data.refNo} />
            </div>
        </>
    )
}
