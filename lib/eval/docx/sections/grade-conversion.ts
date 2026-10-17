/**
 * Grade Conversion Section Generator
 *
 * Creates grade conversion lookup table
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
import { GradeConversionRow } from '../../report-data'
import { TEXT_STYLES, SPACING, COLUMN_WIDTHS, CELL_BORDERS, COLORS } from '../styles'

export function createGradeConversion(gradeConversion: GradeConversionRow[]): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = []

    // Title
    children.push(
        new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [new TextRun({ text: 'Grade Conversion', ...TEXT_STYLES.heading2 })],
        })
    )

    const { grade, usGrade } = COLUMN_WIDTHS.gradeConversion

    // Header row
    const headerRow = new TableRow({
        tableHeader: true,
        children: [
            new TableCell({
                width: { size: grade, type: WidthType.DXA },
                borders: CELL_BORDERS,
                shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: SPACING.tight,
                        children: [new TextRun({ text: 'Original Grade', ...TEXT_STYLES.bodyBold, size: 18 })],
                    }),
                ],
            }),
            new TableCell({
                width: { size: usGrade, type: WidthType.DXA },
                borders: CELL_BORDERS,
                shading: { fill: COLORS.gray100, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: SPACING.tight,
                        children: [new TextRun({ text: 'U.S. Grade', ...TEXT_STYLES.bodyBold, size: 18 })],
                    }),
                ],
            }),
        ],
    })

    // Data rows
    const dataRows = gradeConversion.map(
        (row) =>
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: grade, type: WidthType.DXA },
                        borders: CELL_BORDERS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: SPACING.tight,
                                children: [new TextRun({ text: row.grade, ...TEXT_STYLES.small })],
                            }),
                        ],
                    }),
                    new TableCell({
                        width: { size: usGrade, type: WidthType.DXA },
                        borders: CELL_BORDERS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: SPACING.tight,
                                children: [new TextRun({ text: row.usGrade, ...TEXT_STYLES.small })],
                            }),
                        ],
                    }),
                ],
            })
    )

    const conversionTable = new Table({
        columnWidths: [grade, usGrade],
        rows: [headerRow, ...dataRows],
    })

    children.push(conversionTable)
    children.push(new Paragraph({ spacing: SPACING.section, children: [] }))

    return children
}
