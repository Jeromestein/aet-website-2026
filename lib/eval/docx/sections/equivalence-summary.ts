/**
 * Equivalence Summary Section Generator
 *
 * Creates section 1 with credential summaries
 */

import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, BorderStyle } from 'docx'
import { SampleData } from '../../report-data'
import { TEXT_STYLES, SPACING, PAGE_WIDTH_DXA, COLORS, NO_BORDERS } from '../styles'
import { createSectionTitle } from '../utils'

export function createEquivalenceSummary(data: SampleData): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = []

    // Section title
    children.push(createSectionTitle('1. U.S. Equivalence Summary'))

    // For each credential
    data.credentials.forEach((cred, idx) => {
        // Credential header
        children.push(
            new Paragraph({
                spacing: { before: 120, after: 60 },
                children: [
                    new TextRun({ text: `Credential #${idx + 1}: `, ...TEXT_STYLES.bodyBold }),
                    new TextRun({ text: cred.awardingInstitution, ...TEXT_STYLES.body }),
                ],
            })
        )

        // Equivalency
        children.push(
            new Paragraph({
                spacing: SPACING.tight,
                indent: { left: 360 },
                children: [
                    new TextRun({ text: 'Equivalency: ', ...TEXT_STYLES.label }),
                    new TextRun({ text: cred.equivalenceStatement, ...TEXT_STYLES.bodyBold }),
                ],
            })
        )

        // Credits and GPA row
        const halfWidth = PAGE_WIDTH_DXA / 2 - 180
        children.push(
            new Table({
                columnWidths: [halfWidth, halfWidth],
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: halfWidth, type: WidthType.DXA },
                                borders: NO_BORDERS,
                                children: [
                                    new Paragraph({
                                        indent: { left: 360 },
                                        spacing: { before: 40, after: 40 },
                                        children: [
                                            new TextRun({ text: 'U.S. Credits: ', ...TEXT_STYLES.label }),
                                            new TextRun({ text: cred.totalCredits, ...TEXT_STYLES.bodyBold }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: halfWidth, type: WidthType.DXA },
                                borders: NO_BORDERS,
                                children: [
                                    new Paragraph({
                                        spacing: { before: 40, after: 40 },
                                        children: [
                                            new TextRun({ text: 'U.S. GPA: ', ...TEXT_STYLES.label }),
                                            new TextRun({ text: cred.gpa, ...TEXT_STYLES.bodyBold }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
        )

        // Separator for non-last items
        if (idx < data.credentials.length - 1) {
            children.push(
                new Paragraph({
                    spacing: { before: 120, after: 0 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.gray100 } },
                    children: [],
                })
            )
        }
    })

    // Section spacing
    children.push(new Paragraph({ spacing: SPACING.section, children: [] }))

    return children
}
