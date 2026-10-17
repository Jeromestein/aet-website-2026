/**
 * Reference Lookup Tool
 *
 * Allows Gemini to look up bibliographic references for FCE reports.
 *
 * NOTE: Currently reads from the bundled local JSON catalog.
 * TODO: Future optimization - migrate to Supabase for faster lookups.
 */

import type { FunctionDeclaration } from "@google/genai"
import { Type } from "@google/genai"
import * as fs from "fs"
import * as path from "path"

// Function declaration for Gemini
export const referenceLookupDeclaration: FunctionDeclaration = {
    name: "lookup_references",
    description: "Look up authoritative bibliographic references for a credential evaluation based on country and education level.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            country: {
                type: Type.STRING,
                description: "Country of education (e.g., 'China', 'USA', 'Global')",
            },
            degreeLevel: {
                type: Type.STRING,
                description: "Degree level: 'undergraduate', 'graduate', 'secondary'",
            },
            year: {
                type: Type.NUMBER,
                description: "Year of credential (for edition matching)",
            },
        },
        required: ["country"],
    },
}

// Reference type from JSON
type Reference = {
    id: string
    title: string
    author: string
    publisher: string
    editions: Array<{
        edition: string
        year: number
        isbn: string
    }>
    url?: string
    keywords: string[]
    description: string
}

// Tool execution result type
export type ReferenceLookupResult = {
    success: boolean
    references: Array<{
        citation: string
        isbn?: string
    }>
    warning?: string
}

/**
 * Load references from JSON file
 * TODO: Migrate to Supabase for better performance and easier updates
 */
function loadReferences(): Reference[] {
    try {
        const jsonPath = path.join(
            process.cwd(),
            "lib/eval/resources/references.json"
        )
        const content = fs.readFileSync(jsonPath, "utf-8")
        return JSON.parse(content) as Reference[]
    } catch (error) {
        console.warn("Failed to load references JSON:", error)
        return []
    }
}

/**
 * Calculate relevance score for a reference
 */
function calculateRelevance(ref: Reference, context: string[]): number {
    let score = 0
    const keywords = ref.keywords.map((k) => k.toLowerCase())
    const contextLower = context.map((c) => c.toLowerCase())

    // Title match
    if (contextLower.some((term) => ref.title.toLowerCase().includes(term))) {
        score += 5
    }

    // Keyword match
    for (const term of contextLower) {
        if (keywords.includes(term)) {
            score += 3
        } else if (keywords.some((k) => k.includes(term))) {
            score += 1
        }
    }

    return score
}

/**
 * Get best edition for target year
 */
function getBestEdition(ref: Reference, targetYear?: number) {
    const editions = ref.editions.sort((a, b) => a.year - b.year)

    if (!targetYear) {
        return editions[editions.length - 1] // Latest
    }

    const validEditions = editions.filter((e) => e.year <= targetYear)
    return validEditions.length > 0
        ? validEditions[validEditions.length - 1]
        : editions[0]
}

/**
 * Format APA citation (plain text, no markdown)
 */
function formatCitation(ref: Reference, edition: Reference["editions"][0]): string {
    const editionStr = edition.edition && !edition.edition.includes("Online")
        ? ` (${edition.edition})`
        : ""

    if (ref.author === ref.publisher) {
        return `${ref.author}. (${edition.year}). ${ref.title}${editionStr}.`
    }
    return `${ref.author}. (${edition.year}). ${ref.title}${editionStr}. ${ref.publisher}.`
}

/**
 * Execute reference lookup
 */
export async function executeReferenceLookup(args: {
    country: string
    degreeLevel?: string
    year?: number
}): Promise<ReferenceLookupResult> {
    try {
        const refs = loadReferences()

        if (refs.length === 0) {
            return {
                success: false,
                references: [],
                warning: "Reference database not available. Please add references manually.",
            }
        }

        // Build context terms - only use country for matching, not degree level
        // (degree level can cause false matches like "undergraduate" -> US colleges)
        const context = [args.country.toLowerCase()]

        // Check for specific country matches
        const countrySpecificIds: Record<string, string[]> = {
            "china": ["china_universities", "china_databases", "iau_handbook"],
            "usa": ["best_387_colleges", "petersons_grad_series", "aacrao_transcript_guide"],
            "united states": ["best_387_colleges", "petersons_grad_series", "aacrao_transcript_guide"],
        }

        const countryKey = args.country.toLowerCase()

        // If we have country-specific references, use those
        let relevantRefs: Reference[] = []
        if (countrySpecificIds[countryKey]) {
            relevantRefs = refs.filter((r) => countrySpecificIds[countryKey].includes(r.id))
        }

        // For all other countries (or to fill up to 3 refs), use global defaults
        const globalDefaultIds = ["iau_handbook", "europa_world", "whed_online"]
        const globalRefs = refs.filter((r) => globalDefaultIds.includes(r.id))

        // If we have fewer than 3 refs, add global ones until we have at least 3
        // (Avoid duplicates if a global ref was already matched by country specific list - though unlikely with current data)
        if (relevantRefs.length < 3) {
            for (const globalRef of globalRefs) {
                if (relevantRefs.length >= 3) break
                if (!relevantRefs.find(r => r.id === globalRef.id)) {
                    relevantRefs.push(globalRef)
                }
            }
        }

        const references = relevantRefs.map((ref) => {
            const edition = getBestEdition(ref, args.year)
            return {
                citation: formatCitation(ref, edition),
                isbn: edition.isbn || undefined,
            }
        })

        return {
            success: true,
            references,
        }
    } catch (error) {
        console.warn("Reference lookup failed:", error)
        return {
            success: false,
            references: [],
            warning: "Reference lookup failed. Please add references manually.",
        }
    }
}
