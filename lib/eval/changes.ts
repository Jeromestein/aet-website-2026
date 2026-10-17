import type { SampleData } from "./report-data";
import { calculateStats } from "./gpa";
export type SuggestedChange = { path: string; value: string; reason: string };
const fields = [
  "name",
  "dob",
  "country",
  "purpose",
  "evaluationNotes",
  "references",
];
const credentialFields = [
  "awardingInstitution",
  "country",
  "admissionRequirements",
  "program",
  "grantsAccessTo",
  "standardProgramLength",
  "yearsAttended",
  "yearOfGraduation",
  "equivalenceStatement",
  "courseTableNotes",
];
const courseFields = [
  "year",
  "name",
  "level",
  "credits",
  "grade",
  "usCredits",
  "usGrade",
];
export function changeParts(
  data: SampleData,
  path: string,
): (string | number)[] | null {
  if (fields.includes(path)) return [path];
  const match = /^credentials\[(\d+)\]\.(\w+)(?:\[(\d+)\]\.(\w+))?$/.exec(path);
  if (!match || !data.credentials[Number(match[1])]) return null;
  if (!match[3] && credentialFields.includes(match[2]))
    return ["credentials", Number(match[1]), match[2]];
  if (
    match[2] === "courses" &&
    match[3] &&
    courseFields.includes(match[4]) &&
    data.credentials[Number(match[1])].courses[Number(match[3])]
  ) {
    return [
      "credentials",
      Number(match[1]),
      "courses",
      Number(match[3]),
      match[4],
    ];
  }
  return null;
}
export function applyChanges(
  data: SampleData,
  changes: SuggestedChange[],
): SampleData {
  const result = structuredClone(data);
  const recalculate = new Set<number>();
  for (const change of changes) {
    const parts = changeParts(result, change.path);
    if (!parts) continue;
    let node: unknown = result;
    for (const part of parts.slice(0, -1))
      node = (node as Record<string | number, unknown>)[part];
    (node as Record<string | number, unknown>)[parts[parts.length - 1]] =
      change.value;
    if (
      parts[2] === "courses" &&
      ["credits", "grade", "usCredits", "usGrade"].includes(String(parts[4]))
    ) {
      recalculate.add(Number(parts[1]));
      if (["usCredits", "usGrade"].includes(String(parts[4]))) {
        result.credentials[Number(parts[1])].courses[
          Number(parts[3])
        ].conversionSource = "AI_INFERRED";
      }
    }
  }
  result.credentials = result.credentials.map((cred, index) =>
    recalculate.has(index)
      ? { ...cred, ...calculateStats(cred.courses) }
      : cred,
  );
  return result;
}
