"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { copy, errorText } from "@/lib/preeval/copy";
import { pathFor } from "@/lib/preeval/domain";
import { customerLookupSchema, lookupApplication } from "@/lib/preeval/customer-access";
import s from "./preeval.module.css";

export default function ApplicationLookup({ locale, initialId = "", autoOpen = false }: {
  locale: string; initialId?: string; autoOpen?: boolean;
}) {
  const t = copy(locale);
  const [value, setValue] = useState(initialId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const opened = useRef(false);
  async function open(id: string) {
    setError("");
    const parsed = customerLookupSchema.safeParse({ applicationId: id, locale });
    if (!parsed.success) { setError(t.invalid_application_id); return; }
    setBusy(true);
    try { window.location.assign((await lookupApplication(parsed.data.applicationId, locale)).url); }
    catch (error) { setError(errorText(t, (error as Error).message)); setBusy(false); }
  }
  useEffect(() => {
    if (autoOpen && initialId && !opened.current) { opened.current = true; void open(initialId); }
  }, [autoOpen, initialId]);
  function submit(event: FormEvent) { event.preventDefault(); void open(value); }
  return <>
    <p className={s.eyebrow}>{t.eyebrow}</p>
    <h1 className={s.title}>{t.statusTitle}</h1>
    <p className={s.intro}>{t.statusIntro}</p>
    <form className={s.card + " " + s.form} onSubmit={submit}>
      <label className={s.field}>{t.id}<input name="applicationId" value={value}
        onChange={event => setValue(event.target.value)} required maxLength={64}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>
      <button className={s.button + " " + s.primary} disabled={busy}><Search size={18} />{busy ? t.loading : t.check}</button>
      {error && <p role="alert" className={s.error}>{error}</p>}
    </form>
    <a href={pathFor(locale, "/degree-equivalency-tool/application")}>{t.new}</a>
  </>;
}
