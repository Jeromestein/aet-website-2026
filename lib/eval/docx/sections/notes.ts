/**
 * Notes Section Generator
 *
 * Creates evaluation notes section
 */

import { Paragraph, TextRun, PageBreak } from 'docx'
import { TEXT_STYLES, SPACING } from '../styles'
import { createSectionTitle } from '../utils'

export function createNotes(evaluationNotes: string): Paragraph[] {
    const children: Paragraph[] = []

    // Page break before notes
    children.push(new Paragraph({ children: [new PageBreak()] }))

    // Section title
    children.push(createSectionTitle('Evaluation Notes'))

    // Split notes by newlines and create separate paragraphs (no \n in docx!)
    const lines = evaluationNotes.split('\n').filter((line) => line.trim())

    lines.forEach((line) => {
        children.push(
            new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: line.trim(), ...TEXT_STYLES.small })],
            })
        )
    })

    // Section spacing
    children.push(new Paragraph({ spacing: SPACING.section, children: [] }))

    return children
}
