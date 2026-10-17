/**
 * Credential Details Section Generator
 *
 * Creates detail table for each credential
 */

import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, PageBreak } from 'docx'
import { Credential } from '../../report-data'
import { TEXT_STYLES, SPACING, PAGE_WIDTH_DXA, COLUMN_WIDTHS, CELL_BORDERS } from '../styles'
import { createSectionTitle } from '../utils'

export function createCredentialDetails(
    credential: Credential,
    credentialIndex: number
): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = []

    // Page break before each credential
    children.push(new Paragraph({ children: [new PageBreak()] }))

    // Section title
    children.push(
        new Paragraph({
            spacing: SPACING.section,
            children: [
                new TextRun({
                    text: `3. Credential Details - Credential #${credentialIndex + 1}`,
                    ...TEXT_STYLES.heading1,
                }),
            ],
        })
    )

    const { label: labelWidth, value: valueWidth } = COLUMN_WIDTHS.twoCol

    // Detail rows
    const rows = [
        { label: 'Name of Awarding Institution', value: credential.awardingInstitution, bold: true },
        { label: 'Country', value: credential.country },
        { label: 'Admission Requirements', value: credential.admissionRequirements },
        { label: 'Program', value: credential.program },
        { label: 'Grants Access To', value: credential.grantsAccessTo },
        { label: 'Standard Program Length', value: credential.standardProgramLength },
        { label: 'Years Attended', value: credential.yearsAttended },
        { label: 'Year of Graduation', value: credential.yearOfGraduation },
    ]

    const detailTable = new Table({
        columnWidths: [labelWidth, valueWidth],
        rows: rows.map(
            (row) =>
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: labelWidth, type: WidthType.DXA },
                            borders: CELL_BORDERS,
                            verticalAlign: VerticalAlign.CENTER,
                            children: [
                                new Paragraph({
                                    spacing: { before: 40, after: 40 },
                                    children: [new TextRun({ text: row.label, ...TEXT_STYLES.label })],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: valueWidth, type: WidthType.DXA },
                            borders: CELL_BORDERS,
                            verticalAlign: VerticalAlign.CENTER,
                            children: [
                                new Paragraph({
                                    spacing: { before: 40, after: 40 },
                                    children: [
                                        new TextRun({
                                            text: row.value,
                                            ...(row.bold ? TEXT_STYLES.bodyBold : TEXT_STYLES.body),
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                })
        ),
    })

    children.push(detailTable)
    children.push(new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }))

    return children
}
