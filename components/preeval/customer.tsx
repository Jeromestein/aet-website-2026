"use client";
import { ApplicationDate } from "@/components/application-date";
import { countryOptions, countryLabel } from "@/lib/legacy-application/countries";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { copy, errorText, stateLabel } from "@/lib/preeval/copy";
import { lookupApplication } from "@/lib/preeval/customer-access";
import ApplicationLookup from "./application-lookup";
import { uploadDocuments, validateDocuments } from "@/lib/preeval/upload-client";
import {
  BASE_CENTS,
  FEE_CENTS,
  TOTAL_CENTS,
  pathFor,
} from "@/lib/preeval/domain";
import s from "./preeval.module.css";

export async function api(path: string, body?: unknown) {
  const res = await fetch("/api/pre-evaluation/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body instanceof FormData
        ? undefined
        : body === undefined
          ? undefined
          : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "service_unavailable");
  return data;
}
export function Prices({ locale }: { locale: string }) {
  const t = copy(locale),
    format = (n: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
      }).format(n / 100);
  return (
    <>
      <div className={s.summary}>
        <span>{t.price}</span>
        <strong>{format(BASE_CENTS)}</strong>
      </div>
      <div className={s.summary}>
        <span>{t.fee}</span>
        <span>{format(FEE_CENTS)}</span>
      </div>
      <div className={s.summary}>
        <strong>{t.total}</strong>
        <strong>{format(TOTAL_CENTS)}</strong>
      </div>
    </>
  );
}
export function ApplicationForm({ locale }: { locale: string }) {
  const t = copy(locale),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    country: "",
    schoolName: "",
    countryOfStudy: "",
    degreeObtained: "",
    startDate: "",
    endDate: "",
  });
  const [terms, setTerms] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [restored, setRestored] = useState(false);
  const requestId = useRef("");
  useEffect(() => {
    requestId.current = crypto.randomUUID();
    try {
      requestId.current = sessionStorage.getItem("aet-pre-evaluation-request") || requestId.current;
      sessionStorage.setItem("aet-pre-evaluation-request", requestId.current);
      const saved = JSON.parse(sessionStorage.getItem("aet-pre-evaluation-draft") || "null");
      if (saved?.values && typeof saved.values === "object") {
        setValues(previous => Object.fromEntries(Object.keys(previous).map(key => [key, typeof saved.values[key] === "string" ? saved.values[key] : ""])));
        setStep([0, 1, 2].includes(saved.step) ? saved.step : 0);
      }
    } catch { /* The form remains usable when browser storage is unavailable. */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem("aet-pre-evaluation-draft", JSON.stringify({ values, step })); }
    catch { /* Saving a draft is optional. */ }
  }, [values, step, restored]);
  function reset() {
    if (!confirm(t.resetPrompt)) return;
    setValues(previous => Object.fromEntries(Object.keys(previous).map(key => [key, ""])));
    setStep(0); setTerms(false); setDocuments([]); setError("");
    requestId.current = crypto.randomUUID();
    try {
      sessionStorage.removeItem("aet-pre-evaluation-draft");
      sessionStorage.setItem("aet-pre-evaluation-request", requestId.current);
    } catch { /* The form remains usable without storage. */ }
  }
  const fields =
    step === 0
      ? ["firstName", "middleName", "lastName", "email", "country"]
      : [
          "schoolName",
          "countryOfStudy",
          "degreeObtained",
          "startDate",
          "endDate",
        ];
  const submitting = useRef(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const current = { ...values };
    if (step < 2) {
      const form = new FormData(event.currentTarget);
      for (const field of fields)
        current[field] = field.endsWith("Date") ? values[field] : String(form.get(field) || "");
      setValues(current);
    }
    if (
      step === 1 &&
      (!current.startDate ||
        !current.endDate ||
        current.startDate > current.endDate)
    ) {
      setError(t.invalid_dates);
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      if (documents.length) validateDocuments(documents);
      const data = await api("applications", {
        ...values,
        locale,
        terms,
        uploadsPending: documents.length > 0,
        requestId: requestId.current,
      });
      try {
        sessionStorage.removeItem("aet-pre-evaluation-request");
        sessionStorage.removeItem("aet-pre-evaluation-draft");
      } catch { /* Submission already succeeded. */ }
      let uploadFailed = false;
      if (documents.length) {
        try { await uploadDocuments(data.id, documents, api); }
        catch { uploadFailed = true; }
      }
      window.location.assign(data.url + (uploadFailed ? '&upload=retry' : ''));
    } catch (e) {
      setError(errorText(t, (e as Error).message));
      setBusy(false);
      submitting.current = false;
    }
  }
  return (
    <>
      <p className={s.eyebrow}>{t.eyebrow}</p>
      <h1 className={s.title}>{t.start}</h1>
      <p className={s.helper}>{t.required}</p>
      <p className={s.helper}>{t.draftHint}</p>
      <ol className={s.steps}>
        {[t.step1, t.step2, t.step3].map((label, index) => (
          <li
            key={label}
            className={index === step ? s.active : ""}
            aria-current={index === step ? "step" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>
      <form onSubmit={onSubmit} className={s.card}>
        <div className={s.form}>
          {step < 2 ? (
            <>
              <h2>{step === 0 ? t.contact : t.education}</h2>
              {step === 1 && <p className={s.helper}>{t.hint}</p>}
              <div className={s.grid}>
                {fields.map((name) => (
                  <label
                    key={name}
                    className={
                      s.field +
                      (["email", "schoolName", "degreeObtained"].includes(name)
                        ? " " + s.wide
                        : "")
                    }
                  >
                    {t[name as keyof typeof t]}
                    {name.endsWith('Date') ? <ApplicationDate id={name} label={t[name as keyof typeof t]} value={values[name]} onChange={next => setValues(v => ({...v,[name]:next}))} locale={locale} /> : ['country', 'countryOfStudy'].includes(name) ? <select name={name} required value={values[name]} onChange={e => setValues(v => ({ ...v, [name]: e.target.value }))}>
                      <option value="">{t.chooseCountry}</option>
                      {countryOptions(locale).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select> : <input
                      name={name}
                      value={values[name]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [name]: e.target.value }))
                      }
                      required={name !== "middleName"}
                      maxLength={name === "email" ? 254 : 200}
                      type={
                        name === "email"
                          ? "email"
                          : name.endsWith("Date")
                            ? "month"
                            : "text"
                      }
                      autoComplete={
                        name === "firstName"
                          ? "given-name"
                          : name === "lastName"
                            ? "family-name"
                            : name === "middleName"
                              ? "additional-name"
                              : name === "email"
                                ? "email"
                                : name === "country"
                                  ? "country-name"
                                  : "off"
                      }
                    />}
                  </label>
                ))}
              </div>
              {step === 1 && <div>
                <label className={s.field}>{t.documents}
                  <input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={event => {
                    const selected = Array.from(event.target.files || []);
                    if (selected.length > 5 || selected.some(file => file.size > 20 * 1024 * 1024 || !['application/pdf','image/jpeg','image/png'].includes(file.type))) {
                      setError(t.invalid_file); event.target.value = ''; setDocuments([]); return;
                    }
                    setDocuments(selected); setError('');
                  }} />
                </label>
                <p className={s.helper}>{t.documentsBeforeSubmit}</p>
                {documents.map((file,index)=><p key={index}>{file.name}</p>)}
              </div>}
            </>
          ) : (
            <>
              <h2>{t.step3}</h2>
              <dl className={s.details}>
                {Object.entries(values)
                  .filter(([, value]) => value)
                  .map(([name, value]) => (
                    <div key={name}>
                      <dt>{t[name as keyof typeof t]}</dt>
                      <dd>{["country", "countryOfStudy"].includes(name) ? countryLabel(value, locale) : value}</dd>
                    </div>
                  ))}
              </dl>
              {documents.length > 0 && <p>{t.documents}: {documents.map(file => file.name).join(", ")}</p>}
              <Prices locale={locale} />
              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={terms}
                  required
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <span>
                  {t.terms}{" "}
                  <a href="/terms" target="_blank" rel="noreferrer">
                    {t.termsLink}
                  </a>
                </span>
              </label>
            </>
          )}
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          <div className={s.buttons}>
            {step > 0 && (
              <button
                className={s.secondary}
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                {t.back}
              </button>
            )}
            <button
              className={s.button + " " + s.primary}
              disabled={busy || !restored}
              type="submit"
            >
              {busy ? (
                <LoaderCircle size={18} className={s.spinner} />
              ) : (
                <ArrowRight size={18} />
              )}{" "}
              {busy ? t.loading : step === 2 ? t.submit : t.next}
            </button>
            <button className={s.secondary} type="button" onClick={reset} disabled={busy}>{t.reset}</button>
          </div>
        </div>
      </form>
      <p className={s.note}>{t.note}</p>
    </>
  );
}
export function AccessForm(props: { locale: string; initialId?: string }) {
  return <ApplicationLookup locale={props.locale} initialId={props.initialId} />;
}
export function ConsumeLink({ locale }: { locale: string }) {
  const t = copy(locale),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  const token = useRef("");
  useEffect(() => {
    token.current =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ||
      token.current;
    window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, []);
  async function consume() {
    setBusy(true);
    try {
      const data = await api("access/consume", { token: token.current });
      window.location.replace(data.url);
    } catch (e) {
      setError(errorText(t, (e as Error).message));
      setBusy(false);
    }
  }
  return (
    <>
      <p className={s.eyebrow}>{t.eyebrow}</p>
      <h1 className={s.title}>{t.accessTitle}</h1>
      <div className={s.card}>
        <LockKeyhole size={32} />
        <p>{t.accessIntro}</p>
        <button
          className={s.button}
          onClick={consume}
          disabled={busy || !ready}
        >
          {busy ? t.loading : t.open}
        </button>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.buttons}>
          <a href={pathFor(locale, "/status-check")}>{t.check}</a>
          <a href="/admin/login">{t.adminTitle}</a>
        </div>
      </div>
    </>
  );
}
export function ApplicationResult({
  locale,
  id,
}: {
  locale: string;
  id: string;
}) {
  const t = copy(locale),
    [app, setApp] = useState<any>(null),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [cancelled, setCancelled] = useState(false),
    fileInput = useRef<HTMLInputElement>(null);
  async function load() {
    try {
      let result;
      try { result = await api("applications/" + id); }
      catch (error) {
        if ((error as Error).message !== "access_denied") throw error;
        await lookupApplication(id, locale);
        result = await api("applications/" + id);
      }
      setApp(result);
      setLoadError("");
      return true;
    } catch (e) {
      setLoadError(errorText(t, (e as Error).message));
      return false;
    }
  }
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    void load().then(async loaded => {
      if (loaded && active) timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10000);
      if (loaded && active && new URLSearchParams(location.search).get("checkout") === "success") {
        try { await api("applications/" + id + "/reconcile", {}); if (active) await load(); }
        catch { if (active) setError(t.service_unavailable); }
      }
    });
    if (new URLSearchParams(location.search).get('upload') === 'retry') setError(t.documentRetry);
    setCancelled(
      new URLSearchParams(location.search).get("checkout") === "cancelled",
    );
    return () => { active = false; clearInterval(timer); };
  }, [id, locale]);
  async function action(name: string) {
    setBusy(name);
    setError("");
    try {
      if (name === "checkout") {
        const result = await api("applications/" + id + "/checkout", {});
        location.assign(result.url);
      } else if (name === "logout") {
        await api("logout", { applicationId: id });
        location.assign(pathFor(locale, "/status-check"));
      } else {
        await api("applications/" + id + "/" + name, {});
        await load();
      }
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setBusy("");
    }
  }
  const uploading = useRef(false);
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading.current || busy) return;
    uploading.current = true;
    setBusy("upload");
    setError("");
    setNotice("");
    try {
      await uploadDocuments(id, Array.from(fileInput.current?.files || []), api);
      if (fileInput.current) fileInput.current.value = "";
      setNotice(t.uploadDone);
      await load();
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setBusy("");
      uploading.current = false;
    }
  }
  if (!app)
    return (
      <>
        <h1 className={s.title}>{t.resultTitle}</h1>
        {(error || loadError) ? (
          <>
            <p className={s.error} role="alert">
              {error || loadError}
            </p>
            <AccessForm locale={locale} initialId={id} />
          </>
        ) : (
          <p role="status">{t.loading}</p>
        )}
      </>
    );
  const label = (value: string) => stateLabel(locale, value);
  return (
    <>
      <p className={s.eyebrow}>{t.eyebrow}</p>
      <h1 className={s.title}>{t.resultTitle}</h1>
      <p>
        <CheckCircle2 size={18} /> {t.saved}
      </p>
      <p className={s.id}>
        {t.id}: {app.id}
      </p>
      <p className={s.helper}>{t.savedHint}</p>
      <div className={s.statusbar}>
        <span className={s.badge} data-state={app.status}>
          {label(app.status)}
        </span>
        <span className={s.badge} data-state={app.payment_status}>
          {t.payment}: {label(app.payment_status)}
        </span>
        <span className={s.badge} data-state={app.ai_status}>
          {t.processing}: {label(app.ai_status)}
        </span>
      </div>
      {app.status !== 'cancelled' && <section className={s.card} aria-live="polite">
        <h2>{t.analysisTitle}</h2>
        <p>{app.uploads_pending ? t.analysisUploads : app.ai_status === 'failed' ? (app.document_issue ? t.analysisDocuments : t.analysisFailed) :
          app.ai_status === 'running' ? t.analysisRunning : app.ai_status === 'completed' ? (app.result ? t.analysisResultReady : t.analysisComplete) : t.analysisQueued}</p>
        {app.uploads_pending && <button className={s.secondary} disabled={!!busy} onClick={() => action('uploads-complete')}>{t.finishUploads}</button>}
        {!app.uploads_pending && app.ai_status === 'failed' && <button className={s.secondary} disabled={!!busy} onClick={() => action('retry-ai')}>{t.retryAnalysis}</button>}
      </section>}
      {cancelled && <p className={s.notice}>{t.cancelledCheckout}</p>}
      {(error || loadError) && (
        <p role="alert" className={s.error}>
          {error || loadError}
        </p>
      )}
      {notice && (
        <p role="status" className={s.success}>
          {notice}
        </p>
      )}
      <section className={s.card}>
        <h2>{t.education}</h2>
        <dl className={s.details}>
          {[
            [
              t.contact,
              [app.first_name, app.middle_name, app.last_name]
                .filter(Boolean)
                .join(" "),
            ],
            [t.email, app.email],
            [t.schoolName, app.education.school_name],
            [t.degreeObtained, app.education.degree_obtained],
            [t.countryOfStudy, countryLabel(app.education.country_of_study, locale)],
            [
              t.step2,
              app.education.start_date + " – " + app.education.end_date,
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={s.card + " " + s.result}>
        <h2>{t.result}</h2>
        {app.result ? (
          <>
            <strong>{app.result.result}</strong>
            <h3>{t.reasoning}</h3>
            <p>{app.result.reasoning}</p>
            <a
              href={pathFor(locale, '/apply')}
              className={s.secondary}
            >
              {t.formal}
              <ArrowRight size={17} />
            </a>
          </>
        ) : (
          <>
            <LockKeyhole size={26} />
            <p>
              {app.status === "cancelled"
                ? t.application_cancelled
                : ["refunded", "partially_refunded"].includes(app.payment_status)
                  ? t.refundNotice
                  : app.payment_status !== "paid"
                ? t.locked
                : app.ai_status === "failed"
                  ? t.failed
                  : t.waiting}
            </p>
            {!["paid", "refunded", "partially_refunded"].includes(
              app.payment_status,
            ) &&
              app.status !== "cancelled" && (
                <>
                  <Prices locale={locale} />
                  <div className={s.buttons}>
                    <button
                      className={s.button + " " + s.primary}
                      onClick={() => action("checkout")}
                      disabled={!!busy}
                    >
                      {busy === "checkout" ? t.loading : t.pay}
                    </button>
                  </div>
                </>
              )}
          </>
        )}
      </section>
      <section className={s.card}>
        <h2>{t.documents}</h2>
        <p className={s.helper}>{t.uploadHint}</p>
        <ul className={s.files}>
          {app.files.map((f: any) => (
            <li key={f.id}>
              <FileText size={18} />
              <span>{f.name}</span>
              {f.state === "ready" ? (
                <a href={"/api/pre-evaluation/files/" + f.id}>{t.download}</a>
              ) : (
                <span className={s.badge}>{label(f.state)}</span>
              )}
            </li>
          ))}
        </ul>
        {app.status !== "cancelled" && (
          <form onSubmit={upload} className={s.form}>
            <label className={s.field}>
              {t.upload}
              <input
                ref={fileInput}
                type="file"
                name="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
            </label>
            <button className={s.secondary} disabled={!!busy}>
              {busy === "upload" ? t.loading : t.upload}
            </button>
          </form>
        )}
      </section>
      <div className={s.buttons}>
        <button
          className={s.secondary}
          onClick={() => action("reconcile")}
          disabled={!!busy}
        >
          {t.refresh}
        </button>
        <a className={s.secondary} href={pathFor(locale, "/status-check")}>{t.checkAnother}</a>
        {!["paid", "partially_refunded"].includes(app.payment_status) &&
          app.status !== "cancelled" && (
            <button
              className={s.secondary}
              onClick={() => {
                if (confirm(t.cancelPrompt)) action("cancel");
              }}
              disabled={!!busy}
            >
              {t.cancel}
            </button>
          )}
      </div>
      <p className={s.note}>{t.note}</p>
    </>
  );
}
