/**
 * Documents List Section Generator
 *
 * Creates section 2 with submitted documents
 */

import { Paragraph, TextRun } from 'docx'
import { SampleData } from '../../report-data'
import { TEXT_STYLES, SPACING } from '../styles'
import { createSectionTitle, createBulletItem } from '../utils'

export function createDocumentsList(data: SampleData): Paragraph[] {
    const children: Paragraph[] = []

    // Section title
    children.push(createSectionTitle('2. Documents'))

    // Intro text
    children.push(
        new Paragraph({
            spacing: { before: 60, after: 120 },
            children: [
                new TextRun({
                    text: 'This evaluation is based on the following documents electronically submitted by the applicant:',
                    ...TEXT_STYLES.small,
                    italics: true,
                }),
            ],
        })
    )

    // Document list
    data.documents.forEach((doc) => {
        // Document title (bullet)
        children.push(
            new Paragraph({
                numbering: { reference: 'bullet-list', level: 0 },
                spacing: { before: 120, after: 0 },
                children: [new TextRun({ text: doc.title, ...TEXT_STYLES.bodyBold })],
            })
        )

        // Issued By
        children.push(
            new Paragraph({
                indent: { left: 720 },
                spacing: SPACING.tight,
                children: [
                    new TextRun({ text: 'Issued By: ', ...TEXT_STYLES.label }),
                    new TextRun({ text: doc.issuedBy, ...TEXT_STYLES.body }),
                ],
            })
        )

        // Date of Issue and Certificate No inline
        children.push(
            new Paragraph({
                indent: { left: 720 },
                spacing: SPACING.tight,
                children: [
                    new TextRun({ text: 'Date of Issue: ', ...TEXT_STYLES.label }),
                    new TextRun({ text: doc.dateIssued, ...TEXT_STYLES.body }),
                    new TextRun({ text: '    Certificate No.: ', ...TEXT_STYLES.label }),
                    new TextRun({ text: doc.certificateNo, ...TEXT_STYLES.body }),
                ],
            })
        )
    })

    // Section spacing
    children.push(new Paragraph({ spacing: SPACING.section, children: [] }))

    return children
}
