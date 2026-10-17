import type { SampleData, Credential, Course } from "./report-data";
import { calculateStats } from "./gpa";

type CredentialField = Exclude<
  keyof Credential,
  "id" | "courses" | "gradeConversion"
>;
type CourseField = Exclude<keyof Course, "id">;

/** Immutable edits shared by the paper canvas and auxiliary forms. */
export function createReportEdits(
  data: SampleData,
  onChange: (data: SampleData) => void,
) {
  function commit(next: SampleData) {
    data = next;
    onChange(next);
  }
  function credential(
    index: number,
    update: (value: Credential) => Credential,
  ) {
    commit({
      ...data,
      credentials: data.credentials.map((value, i) =>
        i === index ? update(value) : value,
      ),
    });
  }
  function updateCredentialField(
    index: number,
    field: CredentialField,
    value: string,
  ) {
    credential(index, (current) => ({ ...current, [field]: value }));
  }
  return {
    updateDataField(field: keyof SampleData, value: string) {
      commit({ ...data, [field]: value });
    },
    updateCredentialField,
    updateEquivalenceField: updateCredentialField,
    updateCourse(index: number, id: number, field: CourseField, value: string) {
      credential(index, (current) => {
        const courses = current.courses.map((course) =>
          course.id === id
            ? {
                ...course,
                [field]: value,
                ...(["usCredits", "usGrade"].includes(field)
                  ? { conversionSource: "USER_VERIFIED" }
                  : {}),
              }
            : course,
        );
        const affectsTotals = [
          "credits",
          "grade",
          "usCredits",
          "usGrade",
        ].includes(field);
        return {
          ...current,
          courses,
          ...(affectsTotals ? calculateStats(courses) : {}),
        };
      });
    },
    addCourse(index: number) {
      credential(index, (current) => ({
        ...current,
        courses: [
          ...current.courses,
          {
            id: Math.max(0, ...current.courses.map((course) => course.id)) + 1,
            year: "",
            name: "",
            level: "",
            credits: "",
            grade: "",
            usCredits: "",
            usGrade: "",
          },
        ],
      }));
    },
    deleteCourse(index: number, id: number) {
      credential(index, (current) => {
        const courses = current.courses.filter((course) => course.id !== id);
        return { ...current, courses, ...calculateStats(courses) };
      });
    },
    updateGradeConversion(
      index: number,
      row: number,
      field: "grade" | "usGrade",
      value: string,
    ) {
      credential(index, (current) => ({
        ...current,
        gradeConversion: current.gradeConversion.map((entry, i) =>
          i === row ? { ...entry, [field]: value } : entry,
        ),
      }));
    },
    updateDocument(
      index: number,
      field: keyof SampleData["documents"][number],
      value: string,
    ) {
      commit({
        ...data,
        documents: data.documents.map((document, i) =>
          i === index ? { ...document, [field]: value } : document,
        ),
      });
    },
    addDocument() {
      commit({
        ...data,
        documents: [
          ...data.documents,
          { title: "", issuedBy: "", dateIssued: "", certificateNo: "" },
        ],
      });
    },
    deleteDocument(index: number) {
      commit({
        ...data,
        documents: data.documents.filter((_, i) => i !== index),
      });
    },
  };
}
