"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpRight,
  FileText,
  Globe2,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { SideNav, evalRequest, dateLabel } from "./shared";
type Row = {
  id: string;
  name: string | null;
  applicant: string | null;
  country: string | null;
  ref_no: string | null;
  updated_at: string;
  archived_at: string | null;
};
type Rule = {
  id: string;
  country: string;
  education_level: string | null;
  original_scale: string | null;
  original_grade: string;
  us_grade: string;
  source: string;
  confidence: string;
  notes: string | null;
};
export function EvalDashboard() {
  const [view, setView] = useState<"reports" | "rules">("reports");
  const [rows, setRows] = useState<Row[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const all: Row[] = [];
      let offset = 0;
      while (true) {
        const page = await evalRequest<{ reports: Row[]; hasMore: boolean }>(
          `reports?offset=${offset}`,
        );
        all.push(...page.reports);
        if (!page.hasMore) break;
        offset += page.reports.length;
      }
      const refs = await evalRequest<Rule[]>("rules");
      setRows(all);
      setRules(refs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const visible = useMemo(
    () =>
      rows
        .filter((r) => Boolean(r.archived_at) === archived)
        .filter((r) =>
          [r.name, r.applicant, r.country, r.ref_no].some((v) =>
            v?.toLowerCase().includes(search.toLowerCase()),
          ),
        )
        .sort((a, b) =>
          sort === "name"
            ? (a.name || "").localeCompare(b.name || "")
            : b.updated_at.localeCompare(a.updated_at),
        ),
    [rows, search, sort, archived],
  );
  const activeRows = rows.filter((row) => !row.archived_at);
  const archiveCount = rows.length - activeRows.length;
  const shownRules = rules.filter((r) =>
    [r.country, r.original_grade, r.original_scale].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  return (
    <div className="eval-app">
      <SideNav
        active={view}
        onChange={(value) => {
          setView(value);
          setSearch("");
        }}
      />
      <main className="eval-main">
        <header className="eval-heading">
          <div>
            <p className="eval-eyebrow">AET EVAL / WORKSPACE</p>
            <h1>
              {view === "reports"
                ? "Every credential. A clear path."
                : "Grade reference"}
            </h1>
            <p>
              {view === "reports"
                ? "Create, review, and refine your credential evaluation reports."
                : "Your existing conversion rules, ready for reference during review."}
            </p>
          </div>
          <Link className="eval-button primary" href="/admin/eval/new">
            <Plus size={18} />
            New report
          </Link>
        </header>
        <div className="eval-stat-grid">
          <div>
            <FileText />
            <span>
              Active reports<strong>{loading ? "—" : activeRows.length}</strong>
            </span>
          </div>
          <div>
            <Globe2 />
            <span>
              Countries represented
              <strong>
                {loading
                  ? "—"
                  : new Set(
                      activeRows.map((r) => r.country?.trim()).filter(Boolean),
                    ).size}
              </strong>
            </span>
          </div>
          <div>
            <BookOpen />
            <span>
              Conversion rules<strong>{loading ? "—" : rules.length}</strong>
            </span>
          </div>
        </div>
        <section
          className="eval-list-card"
          aria-label={
            view === "reports" ? "Saved reports" : "Grade conversion rules"
          }
        >
          <div className="eval-list-heading">
            <div>
              <h2>
                {view === "reports"
                  ? archived
                    ? "Archived reports"
                    : "Your reports"
                  : "Conversion library"}
              </h2>
              <p>
                {view === "reports"
                  ? "Pick up where you left off."
                  : "Rules are reference material; verify applicability to each credential."}
              </p>
            </div>
            <button
              className="eval-icon-button"
              aria-label="Refresh workspace"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="eval-search-row">
            <label className="eval-search">
              <Search size={18} />
              <input
                aria-label="Search workspace"
                placeholder={
                  view === "reports"
                    ? "Search name, reference, or country…"
                    : "Search country, grade, or scale…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {view === "reports" && (
              <select
                aria-label="Sort reports"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="updated">Recently updated</option>
                <option value="name">Report name</option>
              </select>
            )}
            {view === "reports" && (
              <button
                className="eval-button"
                aria-pressed={archived}
                onClick={() => setArchived(!archived)}
              >
                {archived ? "Show active" : "Archived reports"}
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="eval-alert">
              {error} <button onClick={load}>Retry</button>
            </p>
          )}
          {loading ? (
            <div className="eval-empty" role="status">
              Loading your workspace…
            </div>
          ) : view === "reports" ? (
            <>
              <div className="eval-table-scroll">
                <table className="eval-reports-table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Applicant</th>
                      <th>Country</th>
                      <th>Last updated</th>
                      <th>
                        <span className="eval-sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link
                            href={`/admin/eval/${row.id}`}
                            className="eval-report-link"
                          >
                            <span className="eval-file-icon">
                              <FileText size={20} />
                            </span>
                            <span>
                              <strong>{row.name || "Untitled report"}</strong>
                              <small>
                                {row.ref_no || "No reference number"}
                              </small>
                            </span>
                          </Link>
                        </td>
                        <td>{row.applicant || "—"}</td>
                        <td>
                          <span className="eval-tag">
                            {row.country || "Not specified"}
                          </span>
                        </td>
                        <td>{dateLabel(row.updated_at)}</td>
                        <td>
                          <Link
                            className="eval-open-link"
                            href={`/admin/eval/${row.id}`}
                            aria-label={`Open ${row.name || "report"}`}
                          >
                            <ArrowUpRight size={19} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!visible.length && (
                <div className="eval-empty">
                  <FileText size={30} />
                  <h3>
                    {search
                      ? "No matching reports"
                      : archived
                        ? "No archived reports"
                        : "Start your first report"}
                  </h3>
                  <p>
                    {search
                      ? "Try a different name, country, or reference number."
                      : archived
                        ? "Archived reports will appear here and can be restored."
                        : "Create a draft or import a credential PDF to get started."}
                  </p>
                  {!search && !archived && (
                    <Link
                      href="/admin/eval/new"
                      className="eval-button primary"
                    >
                      Create a report
                    </Link>
                  )}
                </div>
              )}
              <div className="eval-list-footer">
                {visible.length} of{" "}
                {archived ? archiveCount : activeRows.length}{" "}
                {archived ? "archived" : "active"} reports
              </div>
            </>
          ) : (
            <div className="eval-table-scroll">
              <table className="eval-reports-table">
                <thead>
                  <tr>
                    <th>Country / level</th>
                    <th>Original grade</th>
                    <th>US grade</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {shownRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <strong>{rule.country}</strong>
                        <small>
                          {rule.education_level?.replaceAll("_", " ")}
                        </small>
                      </td>
                      <td>
                        {rule.original_grade}
                        <small>{rule.original_scale}</small>
                      </td>
                      <td>
                        <span className="eval-tag">{rule.us_grade}</span>
                      </td>
                      <td>
                        {rule.source?.replaceAll("_", " ")}
                        <small>{rule.confidence} confidence</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!shownRules.length && (
                <p className="eval-empty">No matching rules.</p>
              )}
            </div>
          )}
        </section>
        <footer className="eval-workspace-footer">
          American Education and Translation Services, CORP (AET)
          <span>Evaluation workspace</span>
        </footer>
      </main>
    </div>
  );
}
