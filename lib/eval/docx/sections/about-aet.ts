/**
 * About AET Page Section Generator
 *
 * Creates the About AET page with company profile and contact information
 */

import {
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    VerticalAlign,
    PageBreak,
} from 'docx'
import { TEXT_STYLES, SPACING, PAGE_WIDTH_DXA, COLORS, NO_BORDERS } from '../styles'
import { createSectionTitle } from '../utils'

export function createAboutAetPage(): (Paragraph | Table)[] {
    const children: (Paragraph | Table)[] = []

    // Page break before this section
    children.push(
        new Paragraph({
            children: [new PageBreak()],
        })
    )

    // About AET Title
    children.push(createSectionTitle('About AET'))

    // Two-column layout: Company Profile | Contact Information
    const halfWidth = PAGE_WIDTH_DXA / 2 - 100

    const twoColTable = new Table({
        columnWidths: [halfWidth, halfWidth],
        rows: [
            new TableRow({
                children: [
                    // Left column: Company Profile
                    new TableCell({
                        width: { size: halfWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            // Heading
                            new Paragraph({
                                spacing: { before: 0, after: 80 },
                                children: [
                                    new TextRun({
                                        text: 'Company Profile',
                                        size: 22,
                                        bold: true,
                                        color: COLORS.blue900,
                                        font: 'Arial',
                                        underline: {},
                                    }),
                                ],
                            }),
                            // Paragraph 1
                            new Paragraph({
                                spacing: { before: 0, after: 80 },
                                children: [
                                    new TextRun({
                                        text: 'Founded in 2009 in Miami, FL, American Education & Translation Services (AET) has established itself as a premier provider of translation and credential evaluation services.',
                                        ...TEXT_STYLES.small,
                                    }),
                                ],
                            }),
                            // Paragraph 2
                            new Paragraph({
                                spacing: { before: 0, after: 80 },
                                children: [
                                    new TextRun({
                                        text: 'AET is a Corporate Member of the American Translators Association (ATA) and a member of the Association of International Educators (NAFSA). Our evaluation services are approved by the Illinois State Board of Education, New Mexico Public Education Department, and Ohio State Board of Education.',
                                        ...TEXT_STYLES.small,
                                    }),
                                ],
                            }),
                            // Paragraph 3
                            new Paragraph({
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        text: 'We provide certified translation services in over 100 languages and have served thousands of clients including universities, licensing boards, and government agencies. We offer convenient online services and have multiple office locations to serve our clients.',
                                        ...TEXT_STYLES.small,
                                    }),
                                ],
                            }),
                        ],
                    }),
                    // Right column: Contact Information
                    new TableCell({
                        width: { size: halfWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            // Heading
                            new Paragraph({
                                spacing: { before: 0, after: 80 },
                                children: [
                                    new TextRun({
                                        text: 'Contact Information',
                                        size: 22,
                                        bold: true,
                                        color: COLORS.blue900,
                                        font: 'Arial',
                                        underline: {},
                                    }),
                                ],
                            }),
                            // Office entries
                            ...createOfficeEntry('Los Angeles Office (California HQ)', '17802 Sky Park Cir, Suite 205 A, IRVINE, CA 92614-6403, United States', '+1 949-954-7996', 'ca2@aet21.com'),
                            ...createOfficeEntry('Miami Office (HQ)', '15321 S Dixie Hwy, #302, Palmetto Bay, FL 33157', '+1 786-250-3999', 'info@aet21.com'),
                            ...createOfficeEntry('Boston Office', '6 Pleasant Street, #418, Malden, MA 02148', '+1 781-605-1970', 'boston@aet21.com'),
                            ...createOfficeEntry('San Francisco Office', '851 Burlway Rd Ste 421, Burlingame CA 94010', '+1 415-868-4892', 'ca@aet21.com'),
                            ...createOfficeEntry('New York Office', '60-20 Woodside Ave, Suite 205, Queens NY 11377', '+1 718-521-6708', 'nyc@aet21.com'),
                        ],
                    }),
                ],
            }),
        ],
    })

    children.push(twoColTable)

    // Senior Evaluator Profile section
    children.push(new Paragraph({ spacing: SPACING.section, children: [] }))
    children.push(createSectionTitle('Senior Evaluator Profile'))

    children.push(
        new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
                new TextRun({
                    text: 'Luguan Yan, Director of Evaluation',
                    size: 24,
                    bold: true,
                    color: COLORS.blue900,
                    font: 'Arial',
                }),
            ],
        })
    )

    // Bio paragraphs
    const bioParagraphs = [
        "Mr. Yan obtained his degree of Bachelor of Arts in Philosophy from Nanjing University, the People's Republic of China in 1991 and the degree of Master of Arts in Philosophy from the University of Miami in 1998.",
        "He worked over 10 years in a prominent evaluation institution as a senior associate director and team leader for Asian-pacific countries. He has completed over 5000 foreign credential evaluation of documents from numerous foreign countries for various universities, licensing boards, U.S. government, and immigration services.",
        "He is a leading expert in the evaluation of credentials from the People's Republic of China and was invited several times to be a keynote speaker to hundreds of admission counselors of U.S. universities for evaluating complex credentials from the People's Republic of China.",
    ]

    bioParagraphs.forEach((text) => {
        children.push(
            new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [new TextRun({ text, ...TEXT_STYLES.small })],
            })
        )
    })

    return children
}

function createOfficeEntry(
    name: string,
    address: string,
    phone: string,
    email: string
): Paragraph[] {
    return [
        new Paragraph({
            spacing: { before: 60, after: 0 },
            children: [
                new TextRun({
                    text: name,
                    size: 20,
                    bold: true,
                    color: COLORS.gray500,
                    font: 'Arial',
                }),
            ],
        }),
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: address, ...TEXT_STYLES.small })],
        }),
        new Paragraph({
            spacing: { before: 0, after: 40 },
            children: [
                new TextRun({ text: `Phone: ${phone} / Email: ${email}`, ...TEXT_STYLES.small }),
            ],
        }),
    ]
}
