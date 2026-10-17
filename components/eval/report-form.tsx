"use client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  emptyCredential,
  type SampleData,
  type Credential,
  type Course,
} from "@/lib/eval/report-data";
import { createReportEdits } from "@/lib/eval/report-editing";
import { calculateStats } from "@/lib/eval/gpa";
import { signatureFiles, signatureUrl } from "@/lib/eval/assets";
type Props = {
  data: SampleData;
  onChange: (data: SampleData) => void;
  section: string;
};
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="eval-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
const credentialLabels: Partial<Record<keyof Credential, string>> = {
  awardingInstitution: "Awarding institution",
  country: "Country",
  program: "Program / qualification",
  admissionRequirements: "Admission requirements",
  grantsAccessTo: "Grants access to",
  standardProgramLength: "Standard program length",
  yearsAttended: "Years attended",
  yearOfGraduation: "Year of graduation",
  equivalenceStatement: "Proposed US equivalence",
};
const courseColumns: [keyof Course, string][] = [
  ["year", "Year"],
  ["name", "Course name"],
  ["level", "Level"],
  ["credits", "Original credits"],
  ["grade", "Original grade"],
  ["usCredits", "US credits"],
  ["usGrade", "US grade"],
];
export function ReportForm({ data, onChange, section }: Props) {
  const [credentialIndex, setCredentialIndex] = useState(0);
  const selected = Math.min(credentialIndex, data.credentials.length - 1),
    credential = data.credentials[selected];
  function top(key: keyof SampleData, value: unknown) {
    onChange({ ...data, [key]: value });
  }
  function updateCredential(value: Partial<Credential>) {
    onChange({
      ...data,
      credentials: data.credentials.map((c, i) =>
        i === selected ? { ...c, ...value } : c,
      ),
    });
  }
  function courses(value: Course[]) {
    updateCredential({ courses: value, ...calculateStats(value) });
  }
  function addCredential() {
    const next = emptyCredential(
      Math.max(0, ...data.credentials.map((c) => c.id)) + 1,
    );
    top("credentials", [...data.credentials, next]);
    setCredentialIndex(data.credentials.length);
  }
  if (section === "details")
    return (
      <div className="eval-form-section">
        <div className="eval-section-heading">
          <h2>Applicant & report</h2>
          <p>The identity and purpose shown on the evaluation report.</p>
        </div>
        <div className="eval-form-grid">
          {(
            [
              ["name", "Applicant name"],
              ["refNo", "Reference number"],
              ["dob", "Date of birth"],
              ["country", "Country of education"],
              ["date", "Report date"],
              ["purpose", "Evaluation purpose"],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={data[key]}
              onChange={(value) => top(key, value)}
            />
          ))}
        </div>
        <div className="eval-soft-note">
          <strong>Start with the source documents</strong>
          <p>
            Import a PDF to prepare a draft, or enter the applicant and
            credential details manually. Review proposed equivalencies before
            exporting.
          </p>
        </div>
      </div>
    );
  if (section === "documents")
    return (
      <div className="eval-form-section">
        <div className="eval-section-heading">
          <h2>Documents reviewed</h2>
          <p>Record the documents supporting this evaluation.</p>
        </div>
        {data.documents.map((document, index) => (
          <div className="eval-nested-card" key={index}>
            <div className="eval-subheading">
              <h3>Document {index + 1}</h3>
              <button
                className="eval-icon-button danger"
                aria-label={`Remove document ${index + 1}`}
                onClick={() => {
                  if (confirm("Remove this document from the draft?"))
                    top(
                      "documents",
                      data.documents.filter((_, i) => i !== index),
                    );
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
            <div className="eval-form-grid">
              {(
                [
                  ["title", "Document title"],
                  ["issuedBy", "Issued by"],
                  ["dateIssued", "Date issued"],
                  ["certificateNo", "Certificate number"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={document[key]}
                  onChange={(value) =>
                    top(
                      "documents",
                      data.documents.map((d, i) =>
                        i === index ? { ...d, [key]: value } : d,
                      ),
                    )
                  }
                />
              ))}
            </div>
          </div>
        ))}
        <button
          className="eval-button"
          onClick={() =>
            top("documents", [
              ...data.documents,
              { title: "", issuedBy: "", dateIssued: "", certificateNo: "" },
            ])
          }
        >
          <Plus size={17} />
          Add document
        </button>
      </div>
    );
  if (section === "credentials" && credential)
    return (
      <div className="eval-form-section">
        <div className="eval-section-heading">
          <h2>Credentials & courses</h2>
          <p>Review each qualification, its course records, and conversions.</p>
        </div>
        <div className="eval-credential-tabs">
          {data.credentials.map((c, i) => (
            <button
              className={i === selected ? "active" : ""}
              key={c.id}
              onClick={() => setCredentialIndex(i)}
            >
              Credential {i + 1}
            </button>
          ))}
          <button onClick={addCredential}>
            <Plus size={16} />
            Add credential
          </button>
        </div>
        <div className="eval-form-grid">
          {Object.entries(credentialLabels).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={String(credential[key as keyof Credential] || "")}
              multiline={key === "equivalenceStatement"}
              onChange={(value) => updateCredential({ [key]: value })}
            />
          ))}
        </div>
        <div className="eval-subheading">
          <h3>Course-by-course analysis</h3>
          <button
            className="eval-text-button"
            onClick={() => courses(credential.courses)}
          >
            Recalculate GPA
          </button>
        </div>
        <div className="eval-course-scroll">
          <table className="eval-course-table">
            <thead>
              <tr>
                {courseColumns.map(([key, label]) => (
                  <th key={key}>{label}</th>
                ))}
                <th>
                  <span className="eval-sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {credential.courses.map((course, index) => (
                <tr key={course.id}>
                  {courseColumns.map(([key, label]) => (
                    <td key={key}>
                      {key === "name" ? (
                        <textarea
                          rows={2}
                          aria-label={`Course ${index + 1} ${label}`}
                          value={String(course[key] ?? "")}
                          onChange={(e) =>
                            createReportEdits(data, onChange).updateCourse(
                              selected,
                              course.id,
                              key as Exclude<keyof Course, "id">,
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        <input
                          aria-label={`Course ${index + 1} ${label}`}
                          value={String(course[key] ?? "")}
                          onChange={(e) =>
                            createReportEdits(data, onChange).updateCourse(
                              selected,
                              course.id,
                              key as Exclude<keyof Course, "id">,
                              e.target.value,
                            )
                          }
                        />
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      className="eval-icon-button danger"
                      aria-label={`Remove course ${index + 1}`}
                      onClick={() => {
                        if (confirm("Remove this course from the draft?"))
                          courses(
                            credential.courses.filter((_, i) => i !== index),
                          );
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!credential.courses.length && (
          <p className="eval-muted">
            No courses yet. Add a row or import a transcript.
          </p>
        )}
        <button
          className="eval-button"
          onClick={() =>
            courses([
              ...credential.courses,
              {
                id: Math.max(0, ...credential.courses.map((c) => c.id)) + 1,
                year: "",
                name: "",
                level: "LD",
                credits: "",
                grade: "",
                usCredits: "",
                usGrade: "",
                conversionSource: "MANUAL",
              },
            ])
          }
        >
          <Plus size={17} />
          Add course
        </button>
        <div className="eval-form-grid eval-totals">
          <Field
            label="Total US credits"
            value={credential.totalCredits}
            onChange={(value) => updateCredential({ totalCredits: value })}
          />
          <Field
            label="GPA"
            value={credential.gpa}
            onChange={(value) => updateCredential({ gpa: value })}
          />
        </div>
        <p className="eval-muted">
          Changes to grades, credits, or course rows recalculate totals using
          the existing HTML Editor scale. Pass, credit, and transfer grades do
          not contribute to GPA.
        </p>
        <Field
          label="Course table notes"
          value={credential.courseTableNotes || ""}
          onChange={(value) => updateCredential({ courseTableNotes: value })}
          multiline
        />
        <div className="eval-subheading">
          <h3>Grade conversion table</h3>
          <button
            className="eval-text-button"
            onClick={() =>
              updateCredential({
                gradeConversion: [
                  ...credential.gradeConversion,
                  { grade: "", usGrade: "" },
                ],
              })
            }
          >
            <Plus size={16} />
            Add mapping
          </button>
        </div>
        {credential.gradeConversion.map((row, i) => (
          <div className="eval-mapping-row" key={i}>
            <Field
              label={`Original grade ${i + 1}`}
              value={row.grade}
              onChange={(value) =>
                updateCredential({
                  gradeConversion: credential.gradeConversion.map((r, j) =>
                    j === i ? { ...r, grade: value } : r,
                  ),
                })
              }
            />
            <Field
              label={`US grade ${i + 1}`}
              value={row.usGrade}
              onChange={(value) =>
                updateCredential({
                  gradeConversion: credential.gradeConversion.map((r, j) =>
                    j === i ? { ...r, usGrade: value } : r,
                  ),
                })
              }
            />
            <button
              className="eval-icon-button danger"
              aria-label={`Remove grade mapping ${i + 1}`}
              onClick={() =>
                updateCredential({
                  gradeConversion: credential.gradeConversion.filter(
                    (_, j) => j !== i,
                  ),
                })
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {data.credentials.length > 1 && (
          <button
            className="eval-button danger"
            onClick={() => {
              if (
                confirm(
                  "Remove this credential and all its courses from the draft?",
                )
              ) {
                top(
                  "credentials",
                  data.credentials.filter((_, i) => i !== selected),
                );
                setCredentialIndex(0);
              }
            }}
          >
            <Trash2 size={16} />
            Remove credential
          </button>
        )}
      </div>
    );
  return (
    <div className="eval-form-section">
      <div className="eval-section-heading">
        <h2>References, notes & signatures</h2>
        <p>
          Document the basis of the evaluation and select the responsible
          reviewers.
        </p>
      </div>
      <Field
        label="References"
        multiline
        value={data.references}
        onChange={(value) => top("references", value)}
      />
      <Field
        label="Evaluation notes"
        multiline
        value={data.evaluationNotes}
        onChange={(value) => top("evaluationNotes", value)}
      />
      <div className="eval-form-grid">
        {(["evaluator", "seniorEvaluator"] as const).map((prefix) => {
          const nameKey = `${prefix}Name` as const,
            sigKey = `${prefix}Signature` as const;
          return (
            <div className="eval-nested-card" key={prefix}>
              <Field
                label={
                  prefix === "evaluator"
                    ? "Evaluator name"
                    : "Senior evaluator name"
                }
                value={data[nameKey]}
                onChange={(value) => top(nameKey, value)}
              />
              <label className="eval-field">
                <span>Signature</span>
                <select
                  value={
                    signatureFiles.includes(data[sigKey].replace(/^\//, ""))
                      ? data[sigKey].replace(/^\//, "")
                      : ""
                  }
                  onChange={(e) =>
                    top(sigKey, e.target.value ? "/" + e.target.value : "")
                  }
                >
                  <option value="">No stored signature</option>
                  {signatureFiles.map((file) => (
                    <option key={file} value={file}>
                      {file.replace("-signature.png", "").replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </label>
              {signatureUrl(data[sigKey]) && (
                <img
                  className="eval-signature-preview"
                  src={signatureUrl(data[sigKey])}
                  alt="Selected signature"
                />
              )}
              <label className="eval-field">
                <span>Upload a signature (PNG/JPEG, up to 280 KB)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 280000) {
                      alert("Choose a signature smaller than 280 KB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => top(sigKey, String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
      <details className="eval-evidence">
        <summary>Source evidence ({data.evidence?.length || 0})</summary>
        {data.evidence?.length ? (
          data.evidence.map((item, i) => (
            <article key={`${item.id}-${i}`}>
              <strong>{item.label}</strong>
              <span className="eval-tag">
                {item.source.replaceAll("_", " ")}
              </span>
              <p>{item.value}</p>
              {item.refs.map((ref, j) => (
                <blockquote key={j}>
                  {ref.quote}
                  <small>
                    {ref.docId} · Page {ref.page} · {ref.method}
                  </small>
                </blockquote>
              ))}
            </article>
          ))
        ) : (
          <p>No field-level evidence has been recorded for this report.</p>
        )}
      </details>
    </div>
  );
}
