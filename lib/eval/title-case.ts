const LOWERCASE_WORDS = new Set([
    'a',
    'an',
    'the',
    'and',
    'but',
    'or',
    'for',
    'nor',
    'so',
    'yet',
    'as',
    'at',
    'by',
    'in',
    'of',
    'on',
    'to',
])

const WORD_PARTS = /([-/])/
const WORD_CORE = /^([^A-Za-z0-9]*)([A-Za-z0-9][A-Za-z0-9']*)([^A-Za-z0-9]*)$/

export function toCourseTitleCase(text: string): string {
    if (!text) return text

    let startOfLine = true

    return text
        .split(/(\s+)/)
        .map((token) => {
            if (!token.trim()) {
                if (token.includes('\n')) startOfLine = true
                return token
            }

            const parts = token.split(WORD_PARTS)
            const formatted = parts.map((part) => {
                if (part === '-' || part === '/') return part

                const match = part.match(WORD_CORE)
                if (!match) return part

                const [, leading, core, trailing] = match
                const lowerCore = core.toLowerCase()
                const isMinor = LOWERCASE_WORDS.has(lowerCore)
                const hasDigits = /[0-9]/.test(core)
                const isAllCaps = core === core.toUpperCase()

                let result = lowerCore
                if (!startOfLine && isMinor) {
                    result = lowerCore
                } else if ((isAllCaps || hasDigits) && !isMinor) {
                    result = core
                } else {
                    result = lowerCore[0].toUpperCase() + lowerCore.slice(1)
                }

                startOfLine = false

                return `${leading}${result}${trailing}`
            })

            return formatted.join('')
        })
        .join('')
}
