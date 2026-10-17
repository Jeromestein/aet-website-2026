/**
 * Header Section Generator
 *
 * Creates: AET Logo + Company Name + Website as a page header
 * Layout: [Logo] | AET (line 1) + AMERICAN EVALUATION... (line 2) | website (right)
 */

import * as fs from 'fs'
import * as path from 'path'
import {
    Paragraph,
    TextRun,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    VerticalAlign,
    BorderStyle,
    Header,
    TextWrappingType,
    TextWrappingSide,
    HorizontalPositionAlign,
    VerticalPositionAlign,
    HorizontalPositionRelativeFrom,
    VerticalPositionRelativeFrom,
} from 'docx'
import { TEXT_STYLES, PAGE_WIDTH_DXA, COLORS, NO_BORDERS } from '../styles'

/**
 * Create the page header with AET logo and company info
 * This will appear on every page
 */
export function createPageHeader(): Header {
    // Read logo image
    const logoPath = path.join(process.cwd(), 'public', 'brand', 'aet-icon-512.png')
    let logoBuffer: Buffer | undefined

    try {
        logoBuffer = fs.readFileSync(logoPath)
    } catch (e) {
        console.warn('Warning: Logo image not found at', logoPath)
    }

    // Column widths: logo (800) | company info (5560) | website (3000)
    const logoWidth = 800
    const companyWidth = 5560
    const websiteWidth = PAGE_WIDTH_DXA - logoWidth - companyWidth

    // Header table with 3 columns
    const headerTable = new Table({
        columnWidths: [logoWidth, companyWidth, websiteWidth],
        rows: [
            new TableRow({
                children: [
                    // Logo cell
                    new TableCell({
                        width: { size: logoWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                children: logoBuffer
                                    ? [
                                        new ImageRun({
                                            type: 'png',
                                            data: logoBuffer,
                                            transformation: { width: 45, height: 45 },
                                            altText: {
                                                title: 'AET Logo',
                                                description: 'American Education & Translation Services Logo',
                                                name: 'AET Logo',
                                            },
                                        }),
                                    ]
                                    : [new TextRun({ text: '[LOGO]', ...TEXT_STYLES.body })],
                            }),
                        ],
                    }),
                    // Company info cell - AET on line 1, full name on line 2
                    new TableCell({
                        width: { size: companyWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            // Line 1: AET
                            new Paragraph({
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'AET',
                                        size: 36,
                                        bold: true,
                                        color: COLORS.blue900,
                                        font: 'Arial',
                                    }),
                                ],
                            }),
                            // Line 2: Full company name
                            new Paragraph({
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'AMERICAN EDUCATION & TRANSLATION SERVICES',
                                        size: 14,
                                        color: COLORS.gray500,
                                        font: 'Arial',
                                    }),
                                ],
                            }),
                        ],
                    }),
                    // Website cell
                    new TableCell({
                        width: { size: websiteWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        text: '⊕ ',
                                        size: 16,
                                        color: COLORS.gray400,
                                        font: 'Arial',
                                    }),
                                    new TextRun({
                                        text: 'www.americantranslationservice.com',
                                        size: 16,
                                        color: COLORS.gray500,
                                        font: 'Arial',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    })

    // Separator line using table with thick bottom border
    const separatorLine = new Table({
        columnWidths: [PAGE_WIDTH_DXA],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
                        margins: { top: 60, bottom: 0, left: 0, right: 0 },
                        borders: {
                            top: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
                            bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.blue900 },
                            left: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
                            right: { style: BorderStyle.NONE, size: 0, color: 'ffffff' },
                        },
                        children: [new Paragraph({ children: [] })],
                    }),
                ],
            }),
        ],
    })

    // Load watermark image (separate from logo)
    const watermarkPath = path.join(process.cwd(), 'public', 'AET-watermark.png')
    let watermarkBuffer: Buffer | undefined

    try {
        watermarkBuffer = fs.readFileSync(watermarkPath)
    } catch (e) {
        console.warn('Warning: Watermark image not found at', watermarkPath)
    }

    // Watermark paragraph - positioned in center, behind content
    const watermarkParagraph = watermarkBuffer
        ? new Paragraph({
            children: [
                new ImageRun({
                    type: 'png',
                    data: watermarkBuffer,
                    transformation: {
                        width: 400,
                        height: 400,
                    },
                    floating: {
                        horizontalPosition: {
                            align: HorizontalPositionAlign.CENTER,
                            relative: HorizontalPositionRelativeFrom.PAGE,
                        },
                        verticalPosition: {
                            align: VerticalPositionAlign.CENTER,
                            relative: VerticalPositionRelativeFrom.PAGE,
                        },
                        wrap: {
                            type: TextWrappingType.NONE,
                            side: TextWrappingSide.BOTH_SIDES,
                        },
                        behindDocument: true,
                    },
                    altText: {
                        title: 'Watermark',
                        description: 'AET watermark logo',
                        name: 'Watermark',
                    },
                }),
            ],
        })
        : null

    return new Header({
        children: watermarkParagraph
            ? [watermarkParagraph, headerTable, separatorLine]
            : [headerTable, separatorLine],
    })
}
