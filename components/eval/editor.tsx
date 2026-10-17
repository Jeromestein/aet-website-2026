"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Save,
  Upload,
  Download,
  Printer,
  Sparkles,
  Eye,
  Plus,
  X,
  History,
  CheckCircle2,
  PencilLine,
  PanelRight,
} from "lucide-react";
import { buildSampleData, type SampleData } from "@/lib/eval/report-data";
import { calculateStats } from "@/lib/eval/gpa";
import { Brand, BackLink, evalRequest, dateLabel } from "./shared";
import { ReportForm, Field } from "./report-form";
import { ReportCanvas } from "./report-canvas";
import { Assistant } from "./assistant";
type SavedReport = {
  id: string;
  name: string;
  content: SampleData;
  updated_at: string;
  archived_at: string | null;
};
type Revision = {
  id: string;
  created_at: string;
  created_by: string;
  content?: SampleData;
};
const tabs = [
  ["details", "Applicant"],
  ["credentials", "Credentials"],
  ["documents", "Documents"],
  ["notes", "Notes & signatures"],
] as const;
export function EvalEditor({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<SavedReport | null>(null);
  const [data, setData] = useState<SampleData | null>(null);
  const [name, setName] = useState("Untitled evaluation");
  const [id, setId] = useState("");
  const [baseline, setBaseline] = useState("");
  const [tab, setTab] = useState("details");
  const [panel, setPanel] = useState<"fields" | "ai" | "history" | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [assistantOpened, setAssistantOpened] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [versions, setVersions] = useState<Revision[]>([]);
  const [version, setVersion] = useState<Revision | null>(null);
  const [hasMoreVersions, setHasMoreVersions] = useState(false);
  const [importResult, setImportResult] = useState<{
    data: Partial<SampleData>;
    warnings: string[];
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const printPreviousMode = useRef<"edit" | "preview" | null>(null);
  const dirty = !!data && JSON.stringify({ name, content: data }) !== baseline;
  const onPreviewReady = useCallback(() => setPreviewReady(true), []);
  useEffect(() => {
    const before = () => {
      printPreviousMode.current = mode;
      flushSync(() => setMode("preview"));
    };
    const after = () => {
      if (printPreviousMode.current) setMode(printPreviousMode.current);
      printPreviousMode.current = null;
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [mode]);
  async function load() {
    setError("");
    try {
      if (reportId === "new") {
        const content = buildSampleData();
        setId(crypto.randomUUID());
        setData(content);
        setBaseline(JSON.stringify({ name: "Untitled evaluation", content }));
      } else {
        const row = await evalRequest<SavedReport>(`reports/${reportId}`);
        setRecord(row);
        setId(row.id);
        setName(row.name || "Untitled evaluation");
        setData(row.content);
        setBaseline(
          JSON.stringify({
            name: row.name || "Untitled evaluation",
            content: row.content,
          }),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [reportId]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  useEffect(() => {
    document.title = `${name} · AET Eval`;
  }, [name]);
  useEffect(() => {
    if (importOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [importOpen]);
  async function loadVersions(offset = 0) {
    if (!record) return;
    try {
      const rows = await evalRequest<Revision[]>(
        `history/${id}?offset=${offset}`,
      );
      setVersions(offset ? [...versions, ...rows] : rows);
      setHasMoreVersions(rows.length === 50);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (panel === "history") void loadVersions();
  }, [panel, record?.updated_at]);
  function change(value: SampleData) {
    setData(value);
    setPreviewReady(false);
    setNotice("");
  }
  async function save() {
    if (!data) return;
    setBusy("Saving report…");
    setError("");
    setNotice("");
    try {
      const row = await evalRequest<SavedReport>("reports", {
        method: "POST",
        body: JSON.stringify({
          id,
          name,
          content: data,
          expectedUpdatedAt: record?.updated_at || null,
        }),
      });
      setRecord(row);
      setBaseline(JSON.stringify({ name: row.name, content: row.content }));
      setName(row.name);
      setData(row.content);
      setNotice("Report saved. A new history version is available.");
      if (reportId === "new")
        window.history.replaceState(null, "", `/admin/eval/${id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function exportDocx() {
    if (!data) return;
    setBusy("Preparing Word document…");
    setError("");
    try {
      const response = await fetch("/api/admin/eval/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(name || "AET Evaluation").replace(/[\\/:*?"<>|]/g, "-")}.docx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function parse(file: File) {
    setBusy("Reading PDF and preparing a draft…");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      setImportResult(await evalRequest("parse", { method: "POST", body }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function back() {
    if (busy) return;
    if (!dirty || confirm("Leave this report and discard unsaved changes?"))
      router.push("/admin/eval");
  }
  const applyImport = () => {
    if (!data || !importResult) return;
    const merged = { ...data, ...importResult.data };
    merged.credentials = merged.credentials.map((c) => ({
      ...c,
      ...calculateStats(c.courses),
    }));
    change(merged);
    setImportOpen(false);
    setImportResult(null);
    setTab("credentials");
    setPanel("fields");
    setMode("edit");
    setNotice("Imported into your draft. Review the fields, then save.");
  };
  return (
    <div className="eval-editor">
      <header className="eval-editor-header no-print">
        <Brand onNavigate={back} />
        <BackLink onClick={back} />
        <span className="eval-header-caption">Evaluation workspace</span>
      </header>
      <main>
        <div className="eval-editor-title no-print">
          <div>
            <p className="eval-eyebrow">
              {record ? "REPORT WORKSPACE" : "NEW EVALUATION"}
            </p>
            <label className="eval-sr-only" htmlFor="eval-name">
              Report name
            </label>
            <input
              id="eval-name"
              className="eval-title-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNotice("");
              }}
              disabled={!!busy}
              maxLength={160}
            />
            <p className="eval-save-status">
              {busy ||
                (dirty
                  ? "Unsaved changes"
                  : record
                    ? `Saved ${dateLabel(record.updated_at)}`
                    : "New draft · not saved")}
            </p>
          </div>
          <div className="eval-editor-actions">
            <button
              className="eval-button"
              disabled={!!busy || !data}
              onClick={() => {
                setImportResult(null);
                setImportOpen(true);
              }}
            >
              <Upload size={17} />
              Import PDF
            </button>
            <button
              className="eval-button primary"
              disabled={!!busy || !data || !name.trim() || (!dirty && !!record)}
              onClick={save}
            >
              <Save size={17} />
              Save report
            </button>
          </div>
        </div>
        {error && (
          <div className="eval-alert no-print" role="alert">
            {error}
            {!data && <button onClick={load}>Retry</button>}
          </div>
        )}
        {notice && (
          <div className="eval-notice no-print" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}
        {busy && (
          <div className="eval-progress no-print" role="status">
            {busy}
          </div>
        )}
        {!data ? (
          <div className="eval-empty">
            {error ? "Report unavailable" : "Loading report…"}
          </div>
        ) : (
          <>
            <div className="eval-editor-tools no-print">
              <nav aria-label="Report view">
                <button
                  className={mode === "edit" ? "active" : ""}
                  aria-pressed={mode === "edit"}
                  disabled={!!busy}
                  onClick={() => {
                    setMode("edit");
                    setPreviewReady(false);
                  }}
                >
                  <PencilLine size={16} /> Edit report
                </button>
                <button
                  className={mode === "preview" ? "active" : ""}
                  aria-pressed={mode === "preview"}
                  disabled={!!busy}
                  onClick={() => {
                    if (mode !== "preview") {
                      setMode("preview");
                      setPreviewReady(false);
                    }
                  }}
                >
                  <Eye size={16} /> Print preview
                </button>
              </nav>
              <div>
                <button
                  className="eval-tool-button"
                  onClick={exportDocx}
                  disabled={!!busy}
                >
                  <Download size={16} /> Word
                </button>
                <button
                  className="eval-tool-button"
                  disabled={!!busy || (mode === "preview" && !previewReady)}
                  onClick={() => {
                    if (mode !== "preview") {
                      setMode("preview");
                      setPreviewReady(false);
                    } else window.print();
                  }}
                >
                  <Printer size={16} />
                  {mode === "preview" ? "Print / PDF" : "Preview & print"}
                </button>
                <span className="eval-tool-divider" aria-hidden="true" />
                {(
                  [
                    ["fields", "Fields", PanelRight],
                    ["ai", "AI assistant", Sparkles],
                    ["history", "History", History],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    className={`eval-tool-button ${panel === key ? "selected" : ""}`}
                    aria-expanded={panel === key}
                    aria-controls="eval-side-panel"
                    disabled={!!busy}
                    onClick={() => {
                      setPanel(panel === key ? null : key);
                      if (key === "ai") setAssistantOpened(true);
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`eval-editor-body ${panel ? "with-panel" : ""}`}>
              <div className="eval-edit-panel">
                <div className="eval-canvas-caption no-print">
                  <span>
                    {mode === "edit"
                      ? "Click any report field to edit"
                      : "Print preview · editing is paused"}
                  </span>
                  <span>
                    US Letter ·{" "}
                    {mode === "edit" ? "Live draft" : "Ready for review"}
                  </span>
                </div>
                <fieldset
                  className="eval-form-fieldset"
                  disabled={!!busy}
                  aria-label="Report document"
                >
                  <ReportCanvas
                    key={mode}
                    data={data}
                    readOnly={mode === "preview"}
                    onChange={change}
                    onReady={onPreviewReady}
                  />
                </fieldset>
              </div>
              <aside
                id="eval-side-panel"
                className="eval-side-panel no-print"
                hidden={!panel}
                aria-label="Report tools"
              >
                <div className="eval-panel-heading">
                  <strong>
                    {panel === "fields"
                      ? "Report fields"
                      : panel === "ai"
                        ? "AI assistant"
                        : "Version history"}
                  </strong>
                  <button
                    className="eval-icon-button"
                    aria-label="Collapse side panel"
                    disabled={!!busy}
                    onClick={() => setPanel(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div hidden={panel !== "fields"}>
                  <label className="eval-panel-section-picker">
                    Section
                    <select
                      aria-label="Field section"
                      value={tab}
                      disabled={!!busy}
                      onChange={(event) => setTab(event.target.value)}
                    >
                      {tabs.map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset
                    className="eval-form-fieldset"
                    disabled={!!busy || mode === "preview"}
                  >
                    <ReportForm data={data} onChange={change} section={tab} />
                  </fieldset>
                  {mode === "preview" && (
                    <p className="eval-panel-hint">
                      Choose Edit report to update fields.
                    </p>
                  )}
                </div>
                <div hidden={panel !== "history"}>
                  <section className="eval-form-section">
                    <div className="eval-section-heading">
                      <h2>Version history</h2>
                      <p>
                        Restore a version into the draft, then save to create a
                        new version.
                      </p>
                    </div>
                    {!record ? (
                      <p>Save this draft to start its version history.</p>
                    ) : (
                      <>
                        <div className="eval-history-list">
                          {versions.map((v) => (
                            <button
                              key={v.id}
                              onClick={async () => {
                                try {
                                  setVersion(
                                    await evalRequest<Revision>(
                                      `revision/${v.id}`,
                                    ),
                                  );
                                } catch (e) {
                                  setError((e as Error).message);
                                }
                              }}
                            >
                              <History size={18} />
                              <span>
                                <strong>
                                  {new Date(v.created_at).toLocaleString()}
                                </strong>
                                <small>
                                  {v.created_by || "Previous editor"}
                                </small>
                              </span>
                              <Eye size={16} />
                            </button>
                          ))}
                        </div>
                        {hasMoreVersions && (
                          <button
                            className="eval-button"
                            onClick={() => loadVersions(versions.length)}
                          >
                            Load older versions
                          </button>
                        )}
                        {version?.content && (
                          <div className="eval-nested-card">
                            <h3>Selected version</h3>
                            <p>
                              {version.content.name || "Unnamed applicant"} ·{" "}
                              {version.content.credentials.length} credentials ·{" "}
                              {version.content.credentials.reduce(
                                (n, c) => n + c.courses.length,
                                0,
                              )}{" "}
                              courses
                            </p>
                            <Field
                              label="Evaluation notes in this version"
                              value={version.content.evaluationNotes}
                              onChange={() => {}}
                              multiline
                              readOnly
                            />
                            <button
                              className="eval-button"
                              disabled={!!busy}
                              onClick={() => {
                                if (
                                  !dirty ||
                                  confirm(
                                    "Replace unsaved changes with this version?",
                                  )
                                ) {
                                  change(version.content!);
                                  setNotice(
                                    "Version restored into the draft. Save to keep it.",
                                  );
                                  setMode("edit");
                                }
                              }}
                            >
                              Restore to draft
                            </button>
                          </div>
                        )}
                        <div className="eval-danger-zone">
                          <h3>
                            {record.archived_at
                              ? "Restore archived report"
                              : "Archive report"}
                          </h3>
                          <p>
                            Keep this report, all versions, and its chat
                            history. Archived reports can be restored from the
                            workspace.
                          </p>
                          <button
                            className="eval-button"
                            disabled={!!busy}
                            onClick={async () => {
                              if (
                                dirty &&
                                !confirm(
                                  "Archive status will change for the saved report. Unsaved draft edits will remain here. Continue?",
                                )
                              )
                                return;
                              setBusy("Updating archive status…");
                              try {
                                const updated = await evalRequest<SavedReport>(
                                  `reports/${id}`,
                                  {
                                    method: "PATCH",
                                    body: JSON.stringify({
                                      expectedUpdatedAt: record.updated_at,
                                      archived: !record.archived_at,
                                    }),
                                  },
                                );
                                setRecord(updated);
                                setNotice(
                                  updated.archived_at
                                    ? "Report archived. You can restore it here."
                                    : "Report restored to the active workspace.",
                                );
                              } catch (e) {
                                setError((e as Error).message);
                              } finally {
                                setBusy("");
                              }
                            }}
                          >
                            {record.archived_at
                              ? "Restore report"
                              : "Archive report"}
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                </div>
                <div hidden={panel !== "ai"}>
                  {assistantOpened && (
                    <Assistant
                      id={id}
                      data={data}
                      saved={!!record}
                      busy={busy}
                      setBusy={setBusy}
                      onApply={(value) => {
                        change(value);
                        setMode("edit");
                      }}
                      onClose={() => setPanel(null)}
                    />
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <dialog
        className="eval-dialog"
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setImportOpen(false);
        }}
      >
        <header>
          <div>
            <p className="eval-eyebrow">DOCUMENT IMPORT</p>
            <h2>From PDF to working draft</h2>
          </div>
          <button
            className="eval-icon-button"
            aria-label="Close PDF import"
            disabled={!!busy}
            onClick={() => setImportOpen(false)}
          >
            <X size={20} />
          </button>
        </header>
        <p>
          Choose a transcript or credential document. Gemini will extract the
          details and propose conversions for your review.
        </p>
        {error && (
          <p className="eval-alert" role="alert">
            {error}
          </p>
        )}
        {!importResult ? (
          <label className="eval-upload-area">
            <Upload size={28} />
            <strong>{busy || "Choose a PDF document"}</strong>
            <span>PDF · up to 20 MB</span>
            <input
              aria-label="Upload credential PDF"
              type="file"
              accept="application/pdf"
              disabled={!!busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void parse(file);
              }}
            />
          </label>
        ) : (
          <div className="eval-import-review">
            <h3>Review extracted draft</h3>
            <p>
              <strong>{importResult.data.name || "Name not found"}</strong> ·{" "}
              {importResult.data.country || "Country not found"}
            </p>
            {importResult.warnings.map((w, i) => (
              <p className="eval-soft-note" key={i}>
                {w}
              </p>
            ))}
            {importResult.data.credentials?.map((c, i) => (
              <details key={i}>
                <summary>
                  {c.program || `Credential ${i + 1}`} · {c.courses.length}{" "}
                  courses
                </summary>
                <p>{c.awardingInstitution}</p>
                <p>{c.equivalenceStatement}</p>
                <div className="eval-table-scroll">
                  <table className="eval-course-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Original grade</th>
                        <th>US grade</th>
                        <th>US credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.courses.map((course) => (
                        <tr key={course.id}>
                          <td>{course.name}</td>
                          <td>{course.grade}</td>
                          <td>{course.usGrade}</td>
                          <td>{course.usCredits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
            <p className="eval-muted">
              Applying replaces the applicant details, credentials, and
              documents in this draft. It does not save the report.
            </p>
            <div className="eval-dialog-actions">
              <button
                className="eval-button"
                onClick={() => setImportResult(null)}
              >
                Choose another PDF
              </button>
              <button
                className="eval-button primary"
                disabled={!!busy}
                onClick={applyImport}
              >
                <Plus size={16} />
                Apply to draft
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
