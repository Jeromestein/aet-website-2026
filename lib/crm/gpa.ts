// Compatibility with AET App's GPACalculator.tsx, including its 4.35 scale.
export const GRADE_POINTS = {
  'A+': 4.35, A: 4, 'A-': 3.65, 'B+': 3.35, B: 3, 'B-': 2.65,
  'C+': 2.35, C: 2, 'C-': 1.65, 'D+': 1.35, D: 1, 'D-': 0.65,
  F: 0, WF: 0, P: 0, CR: 0, T: 0,
} as const;
export type Grade = keyof typeof GRADE_POINTS;
const aliases: Record<string, string> = { FAIL: 'F', PASS: 'P', CREDIT: 'CR' };
const creditOnly = new Set<Grade>(['P', 'CR', 'T']);
export type GPAResult = {
  finalGPA: number;
  totalCredits: number;
  gpaCredits: number;
  courseCount: number;
  gradeDistribution: Record<Grade, { count: number; credits: number }>;
};
export type GPAIssue = { line: number; message: string };

export function calculateGPA(input: string): { result: GPAResult | null; issues: GPAIssue[] } {
  const issues: GPAIssue[] = [];
  const distribution = Object.fromEntries(Object.keys(GRADE_POINTS).map(grade => [grade, { count: 0, credits: 0 }])) as GPAResult['gradeDistribution'];
  let totalCredits = 0, gpaCredits = 0, totalPoints = 0, courseCount = 0;
  input.split(/\r\n?|\n/).forEach((line, index) => {
    if (!line.trim()) return;
    let parts = line.trim().split('\t');
    if (parts.length !== 3) parts = line.trim().split(/\s+/);
    const rawGrade = parts.at(-1)!.trim().toUpperCase();
    const grade = (Object.hasOwn(aliases, rawGrade) ? aliases[rawGrade] : rawGrade) as Grade;
    if (parts.length < 3 || !Object.hasOwn(GRADE_POINTS, grade)) {
      issues.push({ line: index + 1, message: 'Use Course name, Credits, then a supported letter grade, separated by tabs or spaces.' });
      return;
    }
    // Like the original, scan backwards for credits before the final grade.
    let creditIndex = parts.length - 2;
    while (creditIndex > 0 && !/^[+-]?(?:\d|\.\d)/.test(parts[creditIndex].trim())) creditIndex--;
    const token = parts[creditIndex].trim();
    const credits = Number(token);
    if (creditIndex === 0 || !parts.slice(0, creditIndex).join(' ').trim() ||
        !/^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(token) || !Number.isFinite(credits)) {
      issues.push({ line: index + 1, message: 'Enter a course name and non-negative numeric credits (for example, 2.50).' });
      return;
    }
    totalCredits += credits;
    if (!creditOnly.has(grade)) { gpaCredits += credits; totalPoints += credits * GRADE_POINTS[grade]; }
    distribution[grade].count++;
    distribution[grade].credits += credits;
    courseCount++;
  });
  if (!courseCount && !issues.length) issues.push({ line: 0, message: 'Enter at least one course before calculating.' });
  if (![totalCredits, gpaCredits, totalPoints].every(Number.isFinite)) issues.push({ line: 0, message: 'Credit totals are too large. Check your input.' });
  // Do not silently omit malformed transcript rows from an apparently complete GPA.
  if (issues.length) return { result: null, issues };
  return { result: { finalGPA: gpaCredits > 0 ? totalPoints / gpaCredits : 0, totalCredits, gpaCredits, courseCount, gradeDistribution: distribution }, issues };
}

export function formatGPASummary(result: GPAResult): string {
  const separator = '----------------------------------------------';
  const rows: [string, Grade[]][] = Object.keys(GRADE_POINTS)
    .filter(grade => !['F', 'WF', 'P', 'CR', 'T'].includes(grade))
    .map(grade => [grade, [grade as Grade]]);
  rows.push(['F/WF', ['F', 'WF']], ['P/CR', ['P', 'CR']]);
  // The original counted transfer credits but omitted their summary row.
  if (result.gradeDistribution.T.count) rows.push(['T', ['T']]);
  return [
    '======   GPA SUMMARY  ======',
    `Final GPA: ${result.finalGPA.toFixed(6)}`,
    `Final Total Credits/Units: ${result.totalCredits.toFixed(3)}`,
    separator,
    '      Occurrences    Subtotal Course Credits',
    separator,
    ...rows.flatMap(([label, grades]) => {
      const count = grades.reduce((sum, grade) => sum + result.gradeDistribution[grade].count, 0);
      const credits = grades.reduce((sum, grade) => sum + result.gradeDistribution[grade].credits, 0);
      return [`${label}\t${count}\t\t${credits.toFixed(2)}`, separator];
    }),
  ].join('\n');
}
