/**
 * DOCX Utility Functions
 *
 * Helper functions for creating common document elements
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
    LevelFormat,
    INumberingOptions,
    TableVerticalAlign,
} from 'docx'
import { CELL_BORDERS, TEXT_STYLES, SPACING, COLORS } from './styles'

// Create a simple text paragraph
export function createParagraph(
    text: string,
    style: Partial<typeof TEXT_STYLES.body> = TEXT_STYLES.body,
    options: { alignment?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: typeof SPACING.paragraph } = {}
): Paragraph {
    return new Paragraph({
        alignment: options.alignment || AlignmentType.LEFT,
        spacing: options.spacing || SPACING.paragraph,
        children: [new TextRun({ text, ...style })],
    })
}

// Create a section title paragraph
export function createSectionTitle(text: string): Paragraph {
    return new Paragraph({
        spacing: SPACING.section,
        children: [new TextRun({ text, ...TEXT_STYLES.heading1 })],
    })
}

// Create a table cell with text
export function createTextCell(
    text: string,
    width: number,
    options: {
        bold?: boolean
        alignment?: typeof AlignmentType[keyof typeof AlignmentType]
        shading?: string
        verticalAlign?: TableVerticalAlign
        fontSize?: number
    } = {}
): TableCell {
    const textStyle = options.bold ? TEXT_STYLES.bodyBold : TEXT_STYLES.body
    const fontSize = options.fontSize || textStyle.size

    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: CELL_BORDERS,
        verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
        shading: options.shading
            ? { fill: options.shading, type: ShadingType.CLEAR }
            : undefined,
        children: [
            new Paragraph({
                alignment: options.alignment || AlignmentType.LEFT,
                spacing: SPACING.tight,
                children: [new TextRun({ text, ...textStyle, size: fontSize })],
            }),
        ],
    })
}

// Create a label-value table row
export function createLabelValueRow(
    label: string,
    value: string,
    labelWidth: number,
    valueWidth: number,
    options: { valueBold?: boolean } = {}
): TableRow {
    return new TableRow({
        children: [
            new TableCell({
                width: { size: labelWidth, type: WidthType.DXA },
                borders: CELL_BORDERS,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        spacing: SPACING.tight,
                        children: [new TextRun({ text: label, ...TEXT_STYLES.label })],
                    }),
                ],
            }),
            new TableCell({
                width: { size: valueWidth, type: WidthType.DXA },
                borders: CELL_BORDERS,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        spacing: SPACING.tight,
                        children: [
                            new TextRun({
                                text: value,
                                ...(options.valueBold ? TEXT_STYLES.bodyBold : TEXT_STYLES.body),
                            }),
                        ],
                    }),
                ],
            }),
        ],
    })
}

// Create empty paragraph for spacing
export function createSpacing(height: number = 120): Paragraph {
    return new Paragraph({
        spacing: { before: height, after: 0 },
        children: [],
    })
}

// Numbering config for bullet lists
export const BULLET_LIST_CONFIG: INumberingOptions = {
    config: [
        {
            reference: 'bullet-list',
            levels: [
                {
                    level: 0,
                    format: LevelFormat.BULLET,
                    text: '•',
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: {
                            indent: { left: 720, hanging: 360 },
                        },
                    },
                },
            ],
        },
    ],
}

// Create a bullet list item
export function createBulletItem(text: string, bold: boolean = false): Paragraph {
    return new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        spacing: SPACING.paragraph,
        children: [
            new TextRun({
                text,
                ...(bold ? TEXT_STYLES.bodyBold : TEXT_STYLES.body),
            }),
        ],
    })
}
