import { useMemo } from "react"
import { Course, SampleData } from "../types"
import { DEFAULT_ROWS_PER_FIRST_PAGE, DEFAULT_ROWS_PER_FULL_PAGE } from "../constants"

type CoursePage = {
    courses: Course[]
}

type PaginationCounts = {
    first: number
    firstWithTail: number
    full: number
    last: number
}

// Count how many "row units" a course takes (1 + number of newlines)
function getCourseRowUnits(course: Course): number {
    return 1 + (course.name.match(/\n/g) || []).length
}

// Get total row units for a list of courses
function getTotalRowUnits(courses: Course[]): number {
    return courses.reduce((sum, course) => sum + getCourseRowUnits(course), 0)
}

function paginateCourses(courses: Course[], counts: PaginationCounts): CoursePage[] {
    const pages: CoursePage[] = []
    const remainingCourses = [...courses]
    const firstCapacity = Math.max(0, counts.first)
    const firstWithTailCapacity = Math.max(0, counts.firstWithTail)
    const fullCapacity = Math.max(1, counts.full)

    // If all courses fit on first page with tail space
    if (getTotalRowUnits(remainingCourses) <= firstWithTailCapacity) {
        pages.push({
            courses: remainingCourses.splice(0),
        })
        return pages
    }

    // First page - take courses until we reach capacity
    let firstPageCourses: Course[] = []
    let firstPageUnits = 0
    while (remainingCourses.length > 0) {
        const nextCourse = remainingCourses[0]
        const nextUnits = getCourseRowUnits(nextCourse)
        if (firstPageUnits + nextUnits > firstCapacity) break
        firstPageCourses.push(remainingCourses.shift()!)
        firstPageUnits += nextUnits
    }
    if (firstPageCourses.length > 0) {
        pages.push({ courses: firstPageCourses })
    }

    // Fill remaining pages based on row units
    while (remainingCourses.length > 0) {
        let pageCourses: Course[] = []
        let pageUnits = 0
        while (remainingCourses.length > 0) {
            const nextCourse = remainingCourses[0]
            const nextUnits = getCourseRowUnits(nextCourse)
            if (pageUnits + nextUnits > fullCapacity) break
            pageCourses.push(remainingCourses.shift()!)
            pageUnits += nextUnits
        }
        if (pageCourses.length > 0) {
            pages.push({ courses: pageCourses })
        } else {
            // Force at least one course per page to avoid infinite loop
            pages.push({ courses: [remainingCourses.shift()!] })
        }
    }

    return pages
}

export type DocumentEntry = {
    document: SampleData["documents"][number]
    index: number
}

export type ReportPageData = {
    documents: DocumentEntry[]
    courses: Course[]
    credentialIndex?: number
    showCredentialHeading: boolean
    showApplicantInfo: boolean
    showCredentialTable: boolean
    showDocumentsHeading: boolean
    showDocumentsActions: boolean
    documentsHeading?: string
    showCourseSection: boolean
    showGradeConversion: boolean
    showTotals: boolean
    showSignatures: boolean
    showAboutPage: boolean
    isLastPage: boolean
}

type UsePaginationProps = {
    data: SampleData
    readOnly: boolean
    measurements: {
        rowsPerFirstPage: number
        rowsPerFirstPageWithTail: number
        rowsPerFullPage: number
        rowsPerLastPage: number
        documentsPerPage: number
        documentsPerFullPage: number
    }
}

export const usePagination = ({ data, readOnly, measurements }: UsePaginationProps) => {
    const {
        rowsPerFirstPage,
        rowsPerFirstPageWithTail,
        rowsPerFullPage,
        rowsPerLastPage,
        documentsPerPage,
        documentsPerFullPage
    } = measurements

    const documentEntries = useMemo(
        () => data.documents.map((document, index) => ({ document, index })),
        [data.documents]
    )

    const documentPages = useMemo(() => {
        const pages: DocumentEntry[][] = []
        const entries = [...documentEntries]

        // First page
        if (entries.length > 0) {
            pages.push(entries.splice(0, documentsPerPage))
        }

        // Subsequent pages
        while (entries.length > 0) {
            pages.push(entries.splice(0, documentsPerFullPage))
        }

        return pages
    }, [documentEntries, documentsPerPage, documentsPerFullPage])

    const coursePagesByCredential = useMemo(
        () =>
            data.credentials.map((credential) => {
                return paginateCourses(credential.courses, {
                    first: rowsPerFirstPage,
                    firstWithTail: rowsPerFirstPageWithTail,
                    full: rowsPerFullPage,
                    last: rowsPerFullPage, // Not used anymore but kept for type compatibility
                })
            }),
        [data.credentials, rowsPerFirstPage, rowsPerFirstPageWithTail, rowsPerFullPage]
    )

    const reportPages = useMemo(() => {
        const compiled: ReportPageData[] = []
        const hasDocumentPages = documentEntries.length > 0
        const showDocumentsSection = hasDocumentPages || !readOnly
        const introDocumentPages = hasDocumentPages ? documentPages : [[]]
        introDocumentPages.forEach((documentPage, index) => {
            compiled.push({
                documents: documentPage,
                courses: [],
                showApplicantInfo: index === 0,
                showCredentialHeading: false,
                showCredentialTable: false,
                showDocumentsHeading: showDocumentsSection,
                showDocumentsActions: showDocumentsSection && !readOnly && index === introDocumentPages.length - 1,
                documentsHeading: index === 0 ? "2. Documents" : "Documents (continued)",
                showCourseSection: false,
                showGradeConversion: false,
                showTotals: false,
                showSignatures: false,
                showAboutPage: false,
                isLastPage: false,
            })
        })

        data.credentials.forEach((credential, credentialIndex) => {
            const coursePages = coursePagesByCredential[credentialIndex] ?? []
            const effectiveCoursePages = coursePages.length > 0 ? coursePages : [{ courses: [] }]

            const firstCoursePageIndex = effectiveCoursePages.findIndex((page) => page.courses.length > 0)
            const courseSectionIndex = firstCoursePageIndex === -1 ? 0 : firstCoursePageIndex

            effectiveCoursePages.forEach((page, pageIndex) => {
                const isLastOfCredential = pageIndex === effectiveCoursePages.length - 1
                const capacity = pageIndex === 0 ? (rowsPerFirstPage > 0 ? rowsPerFirstPage : DEFAULT_ROWS_PER_FIRST_PAGE) : (rowsPerFullPage > 0 ? rowsPerFullPage : DEFAULT_ROWS_PER_FULL_PAGE)
                const rowsUsed = getTotalRowUnits(page.courses)
                // GPA Points table has 14 rows (fixed), grade conversion table has variable rows
                // Use the larger of the two for layout calculations, plus 6 rows for headers/margins
                const gpaPointsTableRows = 14
                const gradeConversionOverhead = Math.max(credential.gradeConversion.length, gpaPointsTableRows) + 6

                let showGradeConversion = false
                let needsExtraPage = false

                if (isLastOfCredential) {
                    if (capacity - rowsUsed - 1 >= gradeConversionOverhead) {
                        showGradeConversion = true
                    } else {
                        needsExtraPage = true
                    }
                }

                compiled.push({
                    documents: [],
                    courses: page.courses,
                    credentialIndex,
                    showApplicantInfo: false,
                    showCredentialHeading: pageIndex === 0,
                    showCredentialTable: pageIndex === 0,
                    showDocumentsHeading: false,
                    showDocumentsActions: false,
                    showCourseSection: pageIndex === courseSectionIndex,
                    showGradeConversion: showGradeConversion,
                    showTotals: isLastOfCredential,
                    showSignatures: false,
                    showAboutPage: false,
                    isLastPage: false,
                })

                if (needsExtraPage) {
                    compiled.push({
                        documents: [],
                        courses: [],
                        credentialIndex,
                        showApplicantInfo: false,
                        showCredentialHeading: false,
                        showCredentialTable: false,
                        showDocumentsHeading: false,
                        showDocumentsActions: false,
                        showCourseSection: false,
                        showGradeConversion: true,
                        showTotals: false,
                        showSignatures: false,
                        showAboutPage: false,
                        isLastPage: false,
                    })
                }
            })
        })

        compiled.push({
            documents: [],
            courses: [],
            credentialIndex: undefined,
            showApplicantInfo: false,
            showCredentialHeading: false,
            showCredentialTable: false,
            showDocumentsHeading: false,
            showDocumentsActions: false,
            showCourseSection: false,
            showGradeConversion: false,
            showTotals: false,
            showSignatures: true,
            showAboutPage: false,
            isLastPage: false,
        })

        compiled.push({
            documents: [],
            courses: [],
            credentialIndex: undefined,
            showApplicantInfo: false,
            showCredentialHeading: false,
            showCredentialTable: false,
            showDocumentsHeading: false,
            showDocumentsActions: false,
            showCourseSection: false,
            showGradeConversion: false,
            showTotals: false,
            showSignatures: false,
            showAboutPage: true,
            isLastPage: true,
        })

        return compiled
    }, [coursePagesByCredential, data.credentials, documentEntries.length, documentPages, readOnly, data.documents, rowsPerFirstPage, rowsPerFullPage, rowsPerFirstPageWithTail])

    return reportPages
}
