/**
 * Course Table Section Generator
 *
 * Creates course list table with totals
 */

import {
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    VerticalAlign,
    ShadingType,
    AlignmentType,
} from 'docx'
import { Credential } from '../../report-data'
import { toCourseTitleCase } from '../../title-case'
import { TEXT_STYLES, SPACING, COLUMN_WIDTHS, CELL_BORDERS, COLORS } from '../styles'

export function createCourseTable(credential: Credential): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = []

    // Course table title
    children.push(
        new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [new TextRun({ text: 'Course Work', ...TEXT_STYLES.heading2 })],
        })
    )

    const { year, title, credits, grade } = COLUMN_WIDTHS.courseTable

    // Header row
    const headerRow = new TableRow({
        tableHeader: true,
        children: [
            createHeaderCell('Year', year),
            createHeaderCell('Course Title', title),
            createHeaderCell('U.S. Credits', credits),
            createHeaderCell('U.S. Grade', grade),
        ],
    })

    // Data rows
    const dataRows = credential.courses.map(
        (course) =>
            new TableRow({
                children: [
                    createDataCell(course.year, year),
                    createDataCell(toCourseTitleCase(course.name), title, AlignmentType.LEFT),
                    createDataCell(course.usCredits || "", credits),
                    createDataCell(course.usGrade === "P" ? "PASS" : course.usGrade || "", grade),
                ],
            })
    )

    // Totals row
    const totalsRow = new TableRow({
        children: [
            new TableCell({
                width: { size: year, type: WidthType.DXA },
                borders: CELL_BORDERS,
                shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: SPACING.tight,
                        children: [new TextRun({ text: 'TOTALS', ...TEXT_STYLES.bodyBold })],
                    }),
                ],
            }),
            new TableCell({
                width: { size: title, type: WidthType.DXA },
                borders: CELL_BORDERS,
                shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [] })],
            }),
            new TableCell({
                width: { size: credits, type: WidthType.DXA },
                borders: CELL_BORDERS,
                shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: SPACING.tight,
                        children: [new TextRun({ text: credential.totalCredits, ...TEXT_STYLES.bodyBold })],
                    }),
                ],
            }),
            new TableCell({
                width: { size: grade, type: WidthType.DXA },
                borders: CELL_BORDERS,
                shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: SPACING.tight,
                        children: [new TextRun({ text: credential.gpa, ...TEXT_STYLES.bodyBold })],
                    }),
                ],
            }),
        ],
    })

    const courseTable = new Table({
        columnWidths: [year, title, credits, grade],
        rows: [headerRow, ...dataRows, totalsRow],
    })

    children.push(courseTable)
    children.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }))

    return children
}

function createHeaderCell(text: string, width: number): TableCell {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: CELL_BORDERS,
        shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: SPACING.tight,
                children: [new TextRun({ text, ...TEXT_STYLES.bodyBold, size: 18 })],
            }),
        ],
    })
}

function createDataCell(
    text: string,
    width: number,
    alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.CENTER
): TableCell {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: CELL_BORDERS,
        verticalAlign: VerticalAlign.CENTER,
        children: [
            new Paragraph({
                alignment,
                spacing: SPACING.tight,
                children: [new TextRun({ text, ...TEXT_STYLES.small })],
            }),
        ],
    })
}
