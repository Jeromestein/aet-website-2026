/**
 * References Section Generator
 *
 * Creates references list with bullets
 */

import { Paragraph, TextRun } from 'docx'
import { TEXT_STYLES, SPACING } from '../styles'
import { createSectionTitle } from '../utils'

export function createReferences(references: string): Paragraph[] {
    const children: Paragraph[] = []

    // Section title
    children.push(createSectionTitle('References'))

    // Parse references (they start with • in the data)
    const lines = references
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

    lines.forEach((line) => {
        // Remove leading bullet if present
        const cleanedLine = line.startsWith('•') ? line.slice(1).trim() : line

        children.push(
            new Paragraph({
                numbering: { reference: 'bullet-list', level: 0 },
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: cleanedLine, ...TEXT_STYLES.small })],
            })
        )
    })

    // Section spacing
    children.push(new Paragraph({ spacing: SPACING.section, children: [] }))

    return children
}
