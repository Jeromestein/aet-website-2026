"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { copy, errorText, stateLabel } from "@/lib/preeval/copy";
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
  const requestId = useRef("");
  useEffect(() => {
    requestId.current =
      sessionStorage.getItem("aet-pre-evaluation-request") ||
      crypto.randomUUID();
    sessionStorage.setItem("aet-pre-evaluation-request", requestId.current);
  }, []);
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
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const current = { ...values };
    if (step < 2) {
      const form = new FormData(event.currentTarget);
      for (const field of fields)
        current[field] = String(form.get(field) || "");
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
    setBusy(true);
    try {
      const data = await api("applications", {
        ...values,
        locale,
        terms,
        requestId: requestId.current,
      });
      sessionStorage.removeItem("aet-pre-evaluation-request");
      window.location.assign(data.url);
    } catch (e) {
      setError(errorText(t, (e as Error).message));
      setBusy(false);
    }
  }
  return (
    <>
      <p className={s.eyebrow}>{t.eyebrow}</p>
      <h1 className={s.title}>{t.start}</h1>
      <p className={s.helper}>{t.required}</p>
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
                    <input
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
                    />
                  </label>
                ))}
              </div>
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
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
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
              disabled={busy}
              type="submit"
            >
              {busy ? (
                <LoaderCircle size={18} className={s.spinner} />
              ) : (
                <ArrowRight size={18} />
              )}{" "}
              {busy ? t.loading : step === 2 ? t.submit : t.next}
            </button>
          </div>
        </div>
      </form>
      <p className={s.note}>{t.note}</p>
    </>
  );
}
export function AccessForm({
  locale,
  admin = false,
  initialId = "",
}: {
  locale: string;
  admin?: boolean;
  initialId?: string;
}) {
  const t = copy(locale),
    [value, setValue] = useState(initialId),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        admin ? "admin/login" : "access/request",
        admin ? { email: value, locale } : { applicationId: value.trim() },
      );
      setSent(true);
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className={s.eyebrow}>{admin ? "AET WORKSPACE" : t.eyebrow}</p>
      <h1 className={s.title}>{admin ? t.adminTitle : t.statusTitle}</h1>
      <p className={s.intro}>{admin ? t.adminIntro : t.statusIntro}</p>
      <form className={s.card + " " + s.form} onSubmit={send}>
        <label className={s.field}>
          {admin ? t.email : t.id}
          <input
            name={admin ? "email" : "applicationId"}
            type={admin ? "email" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            maxLength={admin ? 254 : 36}
            autoComplete={admin ? "email" : "off"}
          />
        </label>
        <button className={s.button} disabled={busy || sent}>
          {busy ? t.loading : t.send}
        </button>
        {sent && (
          <p role="status" className={s.success}>
            {t.sent}
          </p>
        )}
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
      </form>
      <a href={pathFor(locale, "/degree-equivalency-tool/application")}>
        {t.new}
      </a>
    </>
  );
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
          <a href={pathFor(locale, "/admin/login")}>{t.adminTitle}</a>
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
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [cancelled, setCancelled] = useState(false),
    fileInput = useRef<HTMLInputElement>(null);
  async function load() {
    try {
      setApp(await api("applications/" + id));
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    }
  }
  useEffect(() => {
    load();
    setCancelled(
      new URLSearchParams(location.search).get("checkout") === "cancelled",
    );
    if (new URLSearchParams(location.search).get("checkout") === "success")
      api("applications/" + id + "/reconcile", {})
        .then(load)
        .catch(() => setError(t.service_unavailable));
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [id]);
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
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("upload");
    setError("");
    setNotice("");
    try {
      await api("applications/" + id + "/files", new FormData(e.currentTarget));
      if (fileInput.current) fileInput.current.value = "";
      setNotice(t.uploadDone);
      await load();
    } catch (e) {
      setError(errorText(t, (e as Error).message));
    } finally {
      setBusy("");
    }
  }
  if (!app)
    return (
      <>
        <h1 className={s.title}>{t.resultTitle}</h1>
        {error ? (
          <>
            <p className={s.error} role="alert">
              {error}
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
      {cancelled && <p className={s.notice}>{t.cancelledCheckout}</p>}
      {error && (
        <p role="alert" className={s.error}>
          {error}
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
            [t.countryOfStudy, app.education.country_of_study],
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
              href="https://app.americantranslationservice.com/credential-evaluation-application"
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
              {app.payment_status !== "paid"
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
        <button
          className={s.secondary}
          onClick={() => action("logout")}
          disabled={!!busy}
        >
          {t.logout}
        </button>
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
