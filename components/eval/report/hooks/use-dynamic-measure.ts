/**
 * useDynamicMeasure - Dynamic measurement hook with caching strategy
 *
 * This hook implements a "measure once + cache" strategy to prevent layout oscillation:
 * 1. On first render, measure the actual heights of key elements (row, document item, etc.)
 * 2. Cache these base measurements
 * 3. Use cached values for all subsequent calculations
 * 4. Only re-measure on explicit cache invalidation (e.g., window resize)
 *
 * This eliminates the feedback loop that causes flickering:
 * render → measure → change → render → measure → change → ...
 */

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react"
import { SampleData } from "../types"
import { DEFAULT_ROWS_PER_FIRST_PAGE, DEFAULT_ROWS_PER_FULL_PAGE, DEFAULT_DOCS_PER_FIRST_PAGE, DEFAULT_DOCS_PER_FULL_PAGE } from "../constants"

type UseDynamicMeasureProps = {
    data: SampleData
    onReady?: () => void
}

// Cached measurement values (persists across re-renders)
type CachedMeasurements = {
    rowHeight: number
    headerHeight: number
    documentItemHeight: number
    documentItemGap: number
    tailHeight: number
    contentHeight: number
    headerOffset: number
    documentsListOffset: number
}

export const useDynamicMeasure = ({ data, onReady }: UseDynamicMeasureProps) => {
    const [rowsPerFirstPage, setRowsPerFirstPage] = useState(DEFAULT_ROWS_PER_FIRST_PAGE)
    const [rowsPerFirstPageWithTail, setRowsPerFirstPageWithTail] = useState(DEFAULT_ROWS_PER_FIRST_PAGE)
    const [rowsPerFullPage, setRowsPerFullPage] = useState(DEFAULT_ROWS_PER_FULL_PAGE)
    const [rowsPerLastPage, setRowsPerLastPage] = useState(DEFAULT_ROWS_PER_FULL_PAGE)
    const [documentsPerPage, setDocumentsPerPage] = useState(DEFAULT_DOCS_PER_FIRST_PAGE)
    const [documentsPerFullPage, setDocumentsPerFullPage] = useState(DEFAULT_DOCS_PER_FULL_PAGE)

    // Element refs
    const courseContentRef = useRef<HTMLDivElement>(null)
    const introContentRef = useRef<HTMLDivElement>(null)
    const tableStartRef = useRef<HTMLDivElement>(null)
    const tableHeaderRef = useRef<HTMLTableSectionElement>(null)
    const rowRef = useRef<HTMLTableRowElement>(null)
    const tailRef = useRef<HTMLDivElement>(null)
    const documentsListRef = useRef<HTMLUListElement>(null)
    const documentItemRef = useRef<HTMLLIElement>(null)

    // State refs
    const readySentRef = useRef(false)
    const [fontsReady, setFontsReady] = useState(false)

    // CACHING: Store measured values to prevent re-measurement
    const cachedMeasurementsRef = useRef<CachedMeasurements | null>(null)
    const measurementCompleteRef = useRef(false)

    // Count total newlines in course names - only invalidate cache when this changes
    const totalNewlines = data.credentials.reduce((acc, c) =>
        acc + c.courses.reduce((acc2, course) =>
            acc2 + (course.name.match(/\n/g) || []).length, 0), 0)

    // Invalidate cache only when number of newlines changes
    useEffect(() => {
        cachedMeasurementsRef.current = null
        measurementCompleteRef.current = false
    }, [totalNewlines])

    // Wait for fonts to load
    useEffect(() => {
        if (!onReady) return
        let active = true
        if (document.fonts?.ready) {
            document.fonts.ready
                .then(() => {
                    if (active) setFontsReady(true)
                })
                .catch(() => {
                    if (active) setFontsReady(true)
                })
        } else {
            setFontsReady(true)
        }
        return () => {
            active = false
        }
    }, [onReady])

    useEffect(() => {
        if (!onReady) return
        readySentRef.current = false
    }, [data, onReady])

    // Main measurement effect
    useLayoutEffect(() => {
        const courseContentEl = courseContentRef.current
        const introContentEl = introContentRef.current
        const startEl = tableStartRef.current
        const headerEl = tableHeaderRef.current
        const rowEl = rowRef.current
        const listEl = documentsListRef.current
        const itemEl = documentItemRef.current

        let rafId = requestAnimationFrame(() => {
            // Extra padding to account for credential table textareas (2 lines instead of 1)
            const safetyPadding = 60
            const documentSafetyPadding = 24

            // =====================================================================
            // CACHING LOGIC: Measure once, cache forever
            // =====================================================================

            let cached = cachedMeasurementsRef.current

            // If we don't have cached measurements yet, try to measure now
            if (!cached) {
                let rowHeight = 0
                let headerHeight = 0
                let contentHeight = 0
                let headerOffset = 0
                let tailHeight = 0
                let documentItemHeight = 0
                let documentItemGap = 8
                let documentsListOffset = 0

                // Measure course table elements
                if (courseContentEl && startEl && headerEl && rowEl) {
                    const contentRect = courseContentEl.getBoundingClientRect()
                    const startRect = startEl.getBoundingClientRect()
                    const headerRect = headerEl.getBoundingClientRect()
                    const rowRect = rowEl.getBoundingClientRect()

                    if (contentRect.height > 0 && rowRect.height > 0) {
                        // Use measured height directly.
                        // Previously clamped to 26px, but rows are now taller (30px+).
                        // Clamping too low causes capacity overestimation and overflow.
                        rowHeight = rowRect.height
                        headerHeight = headerRect.height
                        contentHeight = contentRect.height
                        headerOffset = Math.max(0, startRect.top - contentRect.top)
                    }
                }

                // Measure tail (signatures section)
                if (tailRef.current) {
                    const tailRect = tailRef.current.getBoundingClientRect()
                    const tailStyle = window.getComputedStyle(tailRef.current)
                    const marginTop = Number.parseFloat(tailStyle.marginTop) || 0
                    const marginBottom = Number.parseFloat(tailStyle.marginBottom) || 0
                    tailHeight = tailRect.height + marginTop + marginBottom
                }

                // Measure document list elements
                if (introContentEl && listEl && itemEl) {
                    const introRect = introContentEl.getBoundingClientRect()
                    const listRect = listEl.getBoundingClientRect()
                    const itemRect = itemEl.getBoundingClientRect()
                    const itemStyle = window.getComputedStyle(itemEl)

                    const itemMarginTop = Number.parseFloat(itemStyle.marginTop) || 0
                    const itemMarginBottom = Number.parseFloat(itemStyle.marginBottom) || 0
                    documentItemHeight = itemRect.height + itemMarginTop + itemMarginBottom
                    // Calculate available space from list top to content bottom
                    documentsListOffset = introRect.bottom - listRect.top
                    contentHeight = contentHeight || introRect.height
                }

                // Only cache if we have meaningful measurements
                if (rowHeight > 0 || documentItemHeight > 0) {
                    cached = {
                        rowHeight,
                        headerHeight,
                        documentItemHeight,
                        documentItemGap,
                        tailHeight,
                        contentHeight,
                        headerOffset,
                        documentsListOffset,
                    }
                    cachedMeasurementsRef.current = cached
                    measurementCompleteRef.current = true
                }
            }

            // If we still don't have measurements, use defaults and wait
            if (!cached) {
                if (onReady && fontsReady && !readySentRef.current) {
                    readySentRef.current = true
                    onReady()
                }
                return
            }

            // =====================================================================
            // CALCULATION LOGIC: Use cached values to calculate capacity
            // =====================================================================

            const {
                rowHeight,
                headerHeight,
                documentItemHeight,
                documentItemGap,
                tailHeight,
                contentHeight,
                headerOffset,
                documentsListOffset,
            } = cached

            let nextFirst = rowsPerFirstPage
            let nextFirstWithTail = rowsPerFirstPageWithTail
            let nextFull = rowsPerFullPage
            let nextLast = rowsPerLastPage
            let nextDocumentsPerPage = documentsPerPage
            let nextDocumentsPerFullPage = documentsPerFullPage

            // Calculate course rows per page
            if (rowHeight > 0 && contentHeight > 0) {
                const availableFirst = contentHeight - headerOffset - headerHeight - safetyPadding
                const availableFirstWithTail = availableFirst - tailHeight
                const availableFull = contentHeight - headerHeight - safetyPadding
                const availableLast = availableFull - tailHeight

                nextFirst = Math.max(0, Math.floor(availableFirst / rowHeight))
                nextFirstWithTail = Math.max(0, Math.floor(availableFirstWithTail / rowHeight))
                nextFull = Math.max(1, Math.floor(availableFull / rowHeight))
                nextLast = Math.max(1, Math.floor(availableLast / rowHeight))
            }

            // Documents per page: Calculate dynamically based on available space
            if (documentItemHeight > 0 && documentsListOffset > 0) {
                const availableSpace = documentsListOffset - documentSafetyPadding
                const gap = documentItemGap
                // Formula: N * Height + (N - 1) * Gap <= Available
                // N * (Height + Gap) <= Available + Gap
                nextDocumentsPerPage = Math.floor((availableSpace + gap) / (documentItemHeight + gap))
                nextDocumentsPerPage = Math.max(1, nextDocumentsPerPage)
            } else {
                nextDocumentsPerPage = DEFAULT_DOCS_PER_FIRST_PAGE
            }

            // For full pages, assume mostly empty page with just the title ("Documents (continued)")
            // Estimate title height ~50px based on SectionTitle sizing
            if (contentHeight > 0 && documentItemHeight > 0) {
                const titleHeight = 50
                const availableFull = contentHeight - titleHeight - documentSafetyPadding
                const gap = documentItemGap
                nextDocumentsPerFullPage = Math.floor((availableFull + gap) / (documentItemHeight + gap))
                nextDocumentsPerFullPage = Math.max(1, nextDocumentsPerFullPage)
            } else {
                nextDocumentsPerFullPage = DEFAULT_DOCS_PER_FULL_PAGE
            }

            const changed =
                nextFirst !== rowsPerFirstPage ||
                nextFirstWithTail !== rowsPerFirstPageWithTail ||
                nextFull !== rowsPerFullPage ||
                nextLast !== rowsPerLastPage ||
                nextDocumentsPerPage !== documentsPerPage ||
                nextDocumentsPerFullPage !== documentsPerFullPage

            if (changed) {
                readySentRef.current = false
                setRowsPerFirstPage(nextFirst)
                setRowsPerFirstPageWithTail(nextFirstWithTail)
                setRowsPerFullPage(nextFull)
                setRowsPerLastPage(nextLast)
                setDocumentsPerPage(nextDocumentsPerPage)
                setDocumentsPerFullPage(nextDocumentsPerFullPage)
                return
            }

            if (onReady && fontsReady && !readySentRef.current) {
                readySentRef.current = true
                onReady()
            }
        })

        return () => {
            cancelAnimationFrame(rafId)
        }
    }, [
        data.documents.length, // Only re-run when document count changes
        fontsReady,
        onReady,
        rowsPerFirstPage,
        rowsPerFirstPageWithTail,
        rowsPerFullPage,
        rowsPerLastPage,
        documentsPerPage,
        documentsPerFullPage,
    ])

    return {
        measurements: {
            rowsPerFirstPage,
            rowsPerFirstPageWithTail,
            rowsPerFullPage,
            rowsPerLastPage,
            documentsPerPage,
            documentsPerFullPage,
        },
        refs: {
            courseContentRef,
            introContentRef,
            tableStartRef,
            tableHeaderRef,
            rowRef,
            tailRef,
            documentsListRef,
            documentItemRef,
        }
    }
}
