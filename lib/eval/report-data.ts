import { calculateStats } from "./gpa"

export type Course = {
  id: number
  year: string
  name: string
  level: string
  credits: string
  grade: string
  usGrade?: string
  usCredits?: string
  conversionSource?: string
}

export type CredentialDocument = {
  title: string
  issuedBy: string
  dateIssued: string
  certificateNo: string
}

export type GradeConversionRow = {
  grade: string
  usGrade: string
}

export type EvidenceRef = {
  docId: string
  page: number
  bbox?: [number, number, number, number]
  quote: string
  method: "pdf-text" | "ocr" | "ai" | "manual"
  extractor?: string
  extractedAt?: string
}

export type EvidenceItem = {
  id: string
  path: string
  label: string
  value: string
  confidence: "high" | "medium" | "low"
  source: "AICE_RULES" | "AI_INFERRED" | "USER_VERIFIED" | "MANUAL"
  refs: EvidenceRef[]
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
}

export type Credential = {
  id: number
  awardingInstitution: string
  country: string
  admissionRequirements: string
  program: string
  grantsAccessTo: string
  standardProgramLength: string
  yearsAttended: string
  yearOfGraduation: string
  equivalenceStatement: string
  gpa: string
  totalCredits: string
  gradeConversion: GradeConversionRow[]
  courses: Course[]
  courseTableNotes?: string
}

export type SampleData = {
  refNo: string
  name: string
  dob: string
  country: string
  date: string
  purpose: string
  documents: CredentialDocument[]
  credentials: Credential[]
  evaluationNotes: string
  evaluatorName: string
  evaluatorSignature: string
  seniorEvaluatorName: string
  seniorEvaluatorSignature: string
  references: string
  evidence?: EvidenceItem[]
}

export const emptyCredential = (id = 1): Credential => ({
  id, awardingInstitution: "", country: "", admissionRequirements: "", program: "",
  grantsAccessTo: "", standardProgramLength: "", yearsAttended: "", yearOfGraduation: "",
  equivalenceStatement: "", gpa: "N/A", totalCredits: "0.00", gradeConversion: [], courses: [],
});

export const buildSampleData = (): SampleData => ({
  refNo: "", name: "", dob: "", country: "", purpose: "",
  date: new Date().toLocaleDateString("en-US", {timeZone: "America/Los_Angeles", year: "numeric", month: "long", day: "numeric"}),
  documents: [], credentials: [emptyCredential()], evaluationNotes: "", references: "", evidence: [],
  evaluatorName: "", evaluatorSignature: "", seniorEvaluatorName: "", seniorEvaluatorSignature: "",
});

export const rehydrateData = (data: SampleData): SampleData => {
  return {
    ...data,
    credentials: data.credentials.map((cred) => ({
      ...cred,
      get gpa() {
        return calculateStats(this.courses).gpa
      },
      get totalCredits() {
        return calculateStats(this.courses).totalCredits
      },
    })),
  }
}
