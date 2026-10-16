"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  GraduationCap,
  RefreshCw,
  Search,
  X,
  FileText,
  Mail,
} from "lucide-react";
import { api } from "./customer";
import { copy, errorText } from "@/lib/preeval/copy";
import s from "./preeval.module.css";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
export default function PreEvaluationWorkspace() {
  const [rows, setRows] = useState<any[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const t = copy("en");
  async function load() {
    try {
      const data = await api(
        "admin/applications?" +
          new URLSearchParams({ q: query, status: filter, page: String(page) }),
      );
      setRows(data.rows);
      setTotal(data.total);
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [query, filter, page]);
  useEffect(() => {
    if (selected) {
      dialog.current?.showModal();
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        dialog.current?.close();
        document.body.style.overflow = old;
      };
    }
  }, [selected?.id]);
  async function select(id: string) {
    setError("");
    try {
      setSelected(await api("applications/" + id));
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    }
  }
  async function act(body: Record<string, unknown>) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api("applications/" + selected.id + "/staff", body);
      await select(selected.id);
      await load();
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  async function reconcile() {
    setBusy(true);
    try {
      await api("applications/" + selected.id + "/reconcile", {});
      await select(selected.id);
      await load();
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  const badge = (state: string) => (
    <span className={s.badge} data-state={state}>
      {state.replaceAll("_", " ")}
    </span>
  );
  return (
    <>
      <div className={s.toolbar}>
        <a href="/admin/CRM" className={s.secondary}>
          <GraduationCap size={17} />
          Pre-evaluations
        </a>
        <a href="/admin/evaluations" className={s.secondary}>Formal evaluations</a>
        <a href="/admin/CRM/preview" className={s.secondary}>
          Other services preview
        </a>
        <button
          className={s.secondary}
          onClick={async () => {
            await fetch("/api/staff-auth/logout", { method: "POST" }); await fetch("/api/pre-evaluation/logout", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({admin:true}) });
            location.assign("/admin/login");
          }}
        >
          Sign out
        </button>
      </div>
      <p className={s.eyebrow}>AET WORKSPACE</p>
      <h1 className={s.title}>
        Pre-evaluations<span style={{ color: "var(--orange)" }}>.</span>
      </h1>
      <p className={s.intro}>
        Manage applications, supporting documents and preliminary results in one
        place.
      </p>
      <div className={s.toolbar}>
        <label className={s.field} style={{ flex: 1 }}>
          <span>
            <Search size={15} /> Search applications
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Name, email, Application ID or institution"
          />
        </label>
        <label className={s.field}>
          Status
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            {[
              "all",
              "submitted",
              "processing",
              "completed",
              "unpaid",
              "paid",
              "failed",
              "needs_information",
              "cancelled",
              "refunded",
            ].map((v) => (
              <option key={v} value={v}>
                {v.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button className={s.secondary} onClick={load}>
          <RefreshCw size={16} />
          Refresh
        </button>
        <a className={s.button} href="/degree-equivalency-tool/application">
          New application
          <ArrowUpRight size={16} />
        </a>
      </div>
      {error && !selected && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <section className={s.card}>
        <h2>
          {total} application{total !== 1 ? "s" : ""}
        </h2>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {[
                  "Applicant",
                  "Education",
                  "Service",
                  "Payment",
                  "Status",
                  "Updated",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Applicant">
                    <button onClick={() => select(row.id)}>
                      {row.first_name} {row.last_name}{" "}
                      <ArrowUpRight size={13} />
                    </button>
                    <small>{row.id}</small>
                    <small>{row.email}</small>
                  </td>
                  <td data-label="Education">
                    <button onClick={() => select(row.id)}>
                      {row.degree_obtained}
                    </button>
                    <small>{row.school_name}</small>
                  </td>
                  <td data-label="Service">
                    <button onClick={() => select(row.id)}>
                      Pre-Evaluation
                    </button>
                    <small>
                      {row.file_count} document{row.file_count !== 1 ? "s" : ""}
                    </small>
                  </td>
                  <td data-label="Payment">{badge(row.payment_status)}</td>
                  <td data-label="Status">
                    {badge(row.status)}
                    <small>AI: {row.ai_status}</small>
                    {row.email_failures > 0 && (
                      <small>{row.email_failures} email(s) need retry</small>
                    )}
                  </td>
                  <td data-label="Updated">{date(row.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p role="status">
            {loading ? "Loading applications…" : "No matching applications."}
          </p>
        )}
        <div className={s.buttons}>
          <button
            className={s.secondary}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            className={s.secondary}
            disabled={page * 20 >= total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
      <dialog
        ref={dialog}
        className={s.drawer}
        onCancel={() => setSelected(null)}
        aria-label="Pre-evaluation application details"
      >
        {selected && (
          <>
            <div className={s.drawerHeader}>
              <h2>
                {selected.first_name} {selected.last_name}
              </h2>
              <button
                className={s.secondary}
                onClick={() => setSelected(null)}
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>
            <div className={s.drawerInner}>
              <p className={s.id}>{selected.id}</p>
              <div className={s.statusbar}>
                {badge(selected.status)}
                {badge(selected.payment_status)}
                {badge(selected.ai_status)}
              </div>
              {error && (
                <p className={s.error} role="alert">
                  {error}
                </p>
              )}
              <section className={s.card}>
                <h2>Education</h2>
                <dl className={s.details}>
                  {[
                    ["Email", selected.email],
                    ["Institution", selected.education.school_name],
                    ["Degree", selected.education.degree_obtained],
                    ["Country", selected.education.country_of_study],
                    [
                      "Study period",
                      selected.education.start_date +
                        " – " +
                        selected.education.end_date,
                    ],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section className={s.card}>
                <h2>Preliminary result</h2>
                <p className={s.helper}>
                  Paid applications receive the generated result automatically.
                  Corrections are saved with an audit record and a new result
                  notification. This is not a formal credential evaluation.
                </p>
                {selected.ai_error && (
                  <p className={s.error}>
                    AI needs attention: {selected.ai_error}
                  </p>
                )}
                <form
                  key={selected.id + ":" + selected.result_version}
                  className={s.form}
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    act({
                      action: "result",
                      result: {
                        result: f.get("result"),
                        reasoning: f.get("reasoning"),
                      },
                    });
                  }}
                >
                  <label className={s.field}>
                    U.S. equivalency
                    <input
                      name="result"
                      defaultValue={selected.result?.result || ""}
                      required
                      minLength={3}
                      maxLength={200}
                    />
                  </label>
                  <label className={s.field}>
                    Assessment basis
                    <textarea
                      name="reasoning"
                      defaultValue={selected.result?.reasoning || ""}
                      required
                      minLength={10}
                      maxLength={2500}
                    />
                  </label>
                  <button
                    className={s.button}
                    disabled={busy || selected.status === "cancelled"}
                  >
                    Save correction
                  </button>
                </form>
                <div className={s.buttons}>
                  <button
                    className={s.secondary}
                    disabled={
                      busy ||
                      selected.ai_status === "running" ||
                      selected.status === "cancelled"
                    }
                    onClick={() => act({ action: "retry_ai" })}
                  >
                    Regenerate with AI
                  </button>
                  <button
                    className={s.secondary}
                    disabled={busy}
                    onClick={reconcile}
                  >
                    Verify payment
                  </button>
                </div>
              </section>
              <section className={s.card}>
                <h2>Documents</h2>
                <ul className={s.files}>
                  {selected.files.map((f: any) => (
                    <li key={f.id}>
                      <FileText size={17} />
                      <span>{f.name}</span>
                      {f.state === "ready" ? (
                        <a href={"/api/pre-evaluation/files/" + f.id}>
                          Download
                        </a>
                      ) : (
                        badge(f.state)
                      )}
                    </li>
                  ))}
                </ul>
                {!selected.files.length && (
                  <p className={s.helper}>No supporting documents uploaded.</p>
                )}
              </section>
              <section className={s.card}>
                <h2>Internal notes</h2>
                <form
                  className={s.form}
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    act({
                      action: "notes",
                      notes: new FormData(e.currentTarget).get("notes"),
                    });
                  }}
                >
                  <label className={s.field}>
                    Staff notes
                    <textarea
                      name="notes"
                      defaultValue={selected.notes}
                      maxLength={5000}
                    />
                  </label>
                  <button className={s.secondary} disabled={busy}>
                    Save notes
                  </button>
                </form>
              </section>
              <section className={s.card}>
                <h2>Request information</h2>
                <form
                  className={s.form}
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    act({
                      action: "information",
                      message: new FormData(e.currentTarget).get("message"),
                    });
                  }}
                >
                  <label className={s.field}>
                    Message to applicant
                    <textarea
                      name="message"
                      required
                      minLength={3}
                      maxLength={2000}
                    />
                  </label>
                  <button
                    className={s.secondary}
                    disabled={busy || selected.status === "cancelled"}
                  >
                    <Mail size={16} />
                    Send request
                  </button>
                </form>
              </section>
              <section className={s.card}>
                <h2>Email delivery</h2>
                <ul className={s.files}>
                  {selected.emails.map((m: any) => (
                    <li key={m.id}>
                      <div>
                        {m.kind.replaceAll("_", " ")}
                        <p className={s.helper}>
                          {m.state} · {m.attempts} attempt(s)
                          {m.error ? " · " + m.error : ""}
                        </p>
                      </div>
                      {m.state === "failed" && (
                        <button
                          className={s.secondary}
                          disabled={busy}
                          onClick={() =>
                            act({ action: "retry_email", emailId: m.id })
                          }
                        >
                          Retry
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
              <section className={s.card}>
                <h2>Activity</h2>
                <ol className={s.activity}>
                  {selected.audit.map((a: any, i: number) => (
                    <li key={i}>
                      <strong>{a.action}</strong>
                      <br />
                      {a.actor} ·{" "}
                      {new Date(a.created_at).toLocaleString("en-US")}
                    </li>
                  ))}
                </ol>
              </section>
              {selected.status !== "cancelled" &&
                !["paid", "partially_refunded"].includes(
                  selected.payment_status,
                ) && (
                  <button
                    className={s.secondary}
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Cancel this unpaid application?"))
                        act({ action: "cancel" });
                    }}
                  >
                    Cancel application
                  </button>
                )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
