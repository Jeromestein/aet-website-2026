/**
 * DOCX Style Constants
 *
 * Measurements in DXA (twentieths of a point):
 * - 1440 DXA = 1 inch
 * - 720 DXA = 0.5 inch
 * - Font size in half-points: 24 = 12pt, 28 = 14pt
 */

import { BorderStyle, AlignmentType, WidthType } from 'docx'

// Colors (without # prefix for docx)
export const COLORS = {
    blue900: '1e3a8a',
    gray500: '6b7280',
    gray400: '9ca3af',
    gray300: 'd1d5db',
    gray100: 'f3f4f6',
    black: '000000',
    white: 'ffffff',
}

// Font sizes in half-points
export const FONT_SIZES = {
    title: 56,       // 28pt - AET title
    heading1: 28,    // 14pt - Section headings
    heading2: 24,    // 12pt - Sub-headings
    body: 22,        // 11pt - Body text
    small: 20,       // 10pt - Small text
    xs: 18,          // 9pt - Extra small
}

// Page margins in DXA
export const PAGE_MARGINS = {
    top: 1440,      // 1 inch
    right: 1440,
    bottom: 1440,
    left: 1440,
}

// Common border style
export const TABLE_BORDER = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: COLORS.gray300,
}

export const CELL_BORDERS = {
    top: TABLE_BORDER,
    bottom: TABLE_BORDER,
    left: TABLE_BORDER,
    right: TABLE_BORDER,
}

// No borders for invisible layout tables
export const NO_BORDERS = {
    top: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
    left: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
    right: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
}

// Table column widths (Letter size: 8.5" - 2" margins = 6.5" = 9360 DXA)
export const PAGE_WIDTH_DXA = 9360

export const COLUMN_WIDTHS = {
    // 2-column layouts
    twoCol: {
        label: 2808,  // 30%
        value: 6552,  // 70%
    },
    twoColEqual: {
        each: 4680,   // 50%
    },
    // Course table (4 columns)
    courseTable: {
        year: 1200,
        title: 5160,
        credits: 1000,
        grade: 1000,
    },
    // Grade conversion table (2 columns)
    gradeConversion: {
        grade: 1500,
        usGrade: 1500,
    },
}

// Paragraph spacing
export const SPACING = {
    section: { before: 240, after: 120 },
    paragraph: { before: 60, after: 60 },
    tight: { before: 0, after: 0 },
}

// Common text run styles
export const TEXT_STYLES = {
    title: {
        size: FONT_SIZES.title,
        bold: true,
        color: COLORS.blue900,
        font: 'Arial',
    },
    heading1: {
        size: FONT_SIZES.heading1,
        bold: true,
        color: COLORS.blue900,
        font: 'Arial',
    },
    heading2: {
        size: FONT_SIZES.heading2,
        bold: true,
        font: 'Arial',
    },
    body: {
        size: FONT_SIZES.body,
        font: 'Arial',
    },
    bodyBold: {
        size: FONT_SIZES.body,
        bold: true,
        font: 'Arial',
    },
    small: {
        size: FONT_SIZES.small,
        font: 'Arial',
    },
    smallGray: {
        size: FONT_SIZES.small,
        color: COLORS.gray500,
        font: 'Arial',
    },
    label: {
        size: FONT_SIZES.small,
        color: COLORS.gray500,
        font: 'Arial',
    },
}
