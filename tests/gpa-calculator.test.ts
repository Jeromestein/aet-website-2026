import { describe, expect, it } from 'vitest';
import { calculateGPA, formatGPASummary } from '../lib/crm/gpa';

describe('legacy AET transcript GPA', () => {
  it('accepts the original space/tab examples and multiword course names', () => {
    const { result, issues } = calculateGPA('College English 2.50 C\nAdvanced Mathematics\t3.00\tB+');
    expect(issues).toEqual([]);
    expect(result?.finalGPA).toBeCloseTo(15.05 / 5.5, 10);
    expect(result?.totalCredits).toBe(5.5);
    expect(formatGPASummary(result!)).toContain('Final GPA: 2.736364');
    expect(formatGPASummary(result!)).toContain('Final Total Credits/Units: 5.500');
  });
  it('keeps the original A+ and plus/minus points instead of the 4.0 modal scale', () => {
    const cases = [['A+',4.35],['A',4],['A-',3.65],['B+',3.35],['B',3],['B-',2.65],['C+',2.35],['C',2],['C-',1.65],['D+',1.35],['D',1],['D-',0.65]] as const;
    for (const [grade, points] of cases) expect(calculateGPA(`Course 3 ${grade}`).result?.finalGPA).toBeCloseTo(points, 10);
  });
  it('counts failures in GPA, excludes credit-only grades, and combines distribution aliases', () => {
    const { result, issues } = calculateGPA('Math 3 A+\r\nScience 3 a-\r\nEnglish 2 Fail\r\nHistory 1 wf\r\nLab 4 Pass\r\nArt 2 CREDIT\r\nTransfer 3 t\r\n');
    expect(issues).toEqual([]);
    expect(result).toMatchObject({totalCredits:18,gpaCredits:9,courseCount:7});
    expect(result?.finalGPA).toBeCloseTo(24 / 9, 10);
    const summary = formatGPASummary(result!);
    expect(summary).toContain('Final GPA: 2.666667');
    expect(summary).toContain('F/WF\t2\t\t3.00');
    expect(summary).toContain('P/CR\t2\t\t6.00');
    expect(summary).toContain('T\t1\t\t3.00');
  });
  it('handles blank lines, extra whitespace, numbered course names and zero credits', () => {
    const { result, issues } = calculateGPA('\n MATH 101   2.50   b+ \n\nPhysics 201\t0\tF\nBiology 3.5 units A');
    expect(issues).toEqual([]);
    expect(result).toMatchObject({totalCredits:6,gpaCredits:6,courseCount:3});
    expect(result?.finalGPA).toBeCloseTo(22.375 / 6, 10);
  });
  it('matches the legacy zero-GPA result when no GPA-eligible credits exist', () => {
    const result = calculateGPA('Lab 3 P\nArt 2 CR\nTransfer 1 T').result!;
    expect(result).toMatchObject({finalGPA:0,gpaCredits:0,totalCredits:6});
    expect(formatGPASummary(result)).toContain('Final GPA: 0.000000');
  });
  it('reports malformed rows rather than silently calculating an incomplete result', () => {
    for (const line of ['Course 3 unknown','Course -3 A','Course 3oops A','Course NaN A','Course Infinity A','3 A','Course A']) {
      const value = calculateGPA('Valid Course 3 A\n\n' + line);
      expect(value.result, line).toBeNull();
      expect(value.issues, line).toEqual([expect.objectContaining({line:3})]);
    }
  });
  it('does not present empty input as a calculated GPA', () => {
    expect(calculateGPA(' \n\t')).toMatchObject({result:null,issues:[{line:0}]});
  });
  it('retains all original summary grade rows even when their count is zero', () => {
    const summary = formatGPASummary(calculateGPA('English 3 A').result!);
    expect(summary.startsWith('======   GPA SUMMARY  ======\n')).toBe(true);
    expect(summary).toContain('      Occurrences    Subtotal Course Credits');
    expect(summary).toContain('A\t1\t\t3.00');
    expect(summary).toContain('D-\t0\t\t0.00');
    expect(summary).toContain('P/CR\t0\t\t0.00');
  });
});
