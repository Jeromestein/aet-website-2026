import { Course } from "./report-data"

// 1. Grade Points Definition
const GRADE_POINTS: Record<string, number> = {
    "A+": 4.35,
    "A": 4.00,
    "A-": 3.65,
    "B+": 3.35,
    "B": 3.00,
    "B-": 2.65,
    "C+": 2.35,
    "C": 2.00,
    "C-": 1.65,
    "D+": 1.35,
    "D": 1.00,
    "D-": 0.65,
    "F": 0.00,
    "WF": 0.00,
    "Withdrawal": 0.00,
    "F/Withdrawal": 0.00,
    // P/PASS/CR/CREDIT/T are 0.00 but handled specially (excluded from GPA)
}

// 2. Normalization Rules
const ALIASES: Record<string, string> = {
    "FAIL": "F",
    "PASS": "P",
    "CREDIT": "CR",
}

// Grades that count towards Total Credits but NOT GPA Credits
const NON_GPA_CREDITS = new Set(["P", "CR", "T"])

export function calculateStats(courses: Course[]) {
    let totalCredits = 0
    let totalPoints = 0
    let gpaCredits = 0

    for (const course of courses) {
        // Use US credits for calculation
        const creditsStr = (course.usCredits || course.credits || "0").trim()

        // Check if credits are wrapped in parentheses (e.g., "(9.00)")
        // These credits should NOT be counted in totalCredits
        const isExcludedFromTotal = /^\(.*\)$/.test(creditsStr)

        // Extract the numeric value (remove parentheses if present)
        const numericStr = isExcludedFromTotal
            ? creditsStr.slice(1, -1).trim()
            : creditsStr
        const credits = parseFloat(numericStr)

        // Skip invalid credits
        if (!Number.isFinite(credits) || credits < 0) continue

        // Use US grade for calculation
        let grade = (course.usGrade || course.grade || "").trim().toUpperCase()

        // Normalize grade
        if (ALIASES.hasOwnProperty(grade)) {
            grade = ALIASES[grade]
        }

        // Add to total credits only if NOT wrapped in parentheses
        // Parenthesized credits (e.g., "(9.00)") are excluded from total
        // but still count towards GPA if applicable
        if (!isExcludedFromTotal) {
            totalCredits += credits
        }

        // Check if it counts towards GPA
        if (GRADE_POINTS.hasOwnProperty(grade)) {
            // It's a graded course (including F/WF which are 0.00)
            const points = GRADE_POINTS[grade]
            totalPoints += credits * points
            gpaCredits += credits
        } else if (NON_GPA_CREDITS.has(grade)) {
            // It's PASS/Credit/Transfer - counts for total credits (already added) but NOT GPA
            continue
        } else {
            // Unknown grade - arguably should not count for anything or user needs to fix
            // For now, we assume if it has credits, it counts for total.
            // But strictly speaking, if we don't recognize the grade, we might not want to count it.
            // However, current logic just adds to totalCredits above.
        }
    }

    const gpa = gpaCredits > 0 ? (totalPoints / gpaCredits).toFixed(2) : "0.00"

    return {
        totalCredits: totalCredits.toFixed(2),
        gpa: gpaCredits > 0 ? gpa : "N/A"
    }
}
