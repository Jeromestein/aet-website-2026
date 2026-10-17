/**
 * Applicant Info Section Generator
 *
 * Creates 2-column grid with applicant details
 */

import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign } from 'docx'
import { SampleData } from '../../report-data'
import { TEXT_STYLES, SPACING, PAGE_WIDTH_DXA, NO_BORDERS } from '../styles'

export function createApplicantInfo(data: SampleData): (Paragraph | Table)[] {
    const halfWidth = PAGE_WIDTH_DXA / 2 - 100
    const labelWidth = Math.floor(halfWidth * 0.4)
    const valueWidth = Math.floor(halfWidth * 0.6)

    // Create 2x3 grid table for applicant info
    const infoTable = new Table({
        columnWidths: [labelWidth, valueWidth, labelWidth, valueWidth],
        rows: [
            // Row 1: Name | Date of Evaluation
            new TableRow({
                children: [
                    createLabelCell('NAME OF APPLICANT', labelWidth),
                    createValueCell(data.name, valueWidth, true),
                    createLabelCell('DATE OF EVALUATION', labelWidth),
                    createValueCell(data.date, valueWidth, true),
                ],
            }),
            // Row 2: DOB | Evaluation ID
            new TableRow({
                children: [
                    createLabelCell('DATE OF BIRTH', labelWidth),
                    createValueCell(data.dob, valueWidth, true),
                    createLabelCell('EVALUATION ID', labelWidth),
                    createValueCell(data.refNo, valueWidth, true),
                ],
            }),
        ],
    })

    // Purpose row (full width)
    const purposeTable = new Table({
        columnWidths: [labelWidth, PAGE_WIDTH_DXA - labelWidth],
        rows: [
            new TableRow({
                children: [
                    createLabelCell('PURPOSE OF EVALUATION', labelWidth),
                    createValueCell(data.purpose, PAGE_WIDTH_DXA - labelWidth, true),
                ],
            }),
            new TableRow({
                children: [
                    createLabelCell('COUNTRY OF EDUCATION', labelWidth),
                    createValueCell(data.country, PAGE_WIDTH_DXA - labelWidth, true),
                ],
            }),
        ],
    })

    return [
        infoTable,
        new Paragraph({ spacing: { before: 60, after: 0 }, children: [] }),
        purposeTable,
        new Paragraph({ spacing: SPACING.section, children: [] }),
    ]
}

function createLabelCell(text: string, width: number): TableCell {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: NO_BORDERS,
        children: [
            new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text, ...TEXT_STYLES.label })],
            }),
        ],
    })
}

function createValueCell(text: string, width: number, bold: boolean = false): TableCell {
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        borders: NO_BORDERS,
        children: [
            new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text, ...(bold ? TEXT_STYLES.bodyBold : TEXT_STYLES.body) })],
            }),
        ],
    })
}
