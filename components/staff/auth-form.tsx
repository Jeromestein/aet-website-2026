"use client";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, ArrowRight } from "lucide-react";
import s from "./auth.module.css";
export default function StaffAuthForm({
  returnTo = "/admin/CRM",
}: {
  returnTo?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [visible, setVisible] = useState(false),
    [replacement, setReplacement] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/staff-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") || "").trim(),
          password: String(data.get("password") || ""),
          redirect: returnTo,
          ...(replacement
            ? { replacement: String(data.get("replacement") || "") }
            : {}),
        }),
      });
      const result = await response.json();
      if (result.passwordUpdateRequired) setReplacement(true);
      if (!response.ok)
        throw new Error(result.error || "Please try again shortly.");
      if (result.url) location.assign(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.card} aria-labelledby="staff-title">
      <div className={s.eyebrow}>
        <LockKeyhole size={15} /> AET STAFF
      </div>
      <h1 id="staff-title">Welcome back</h1>
      <p className={s.intro}>
        Sign in to manage applications and support your clients.
      </p>
      <form onSubmit={submit}>
        <label className={s.field}>
          Work email
          <input
            name="email"
            type="email"
            autoComplete="username"
            maxLength={254}
            required
            placeholder="you@company.com"
          />
        </label>
        <div className={s.field}>
          <label htmlFor="staff-password">Password</label>
          <div className={s.password}>
            <input
              id="staff-password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              maxLength={1024}
              required
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>
        {replacement && (
          <label className={s.field}>
            New password
            <input
              name="replacement"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={1024}
              required
            />
          </label>
        )}
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <button className={s.submit} disabled={busy}>
          {busy ? "Please wait…" : "Sign in"}
          {!busy && <ArrowRight size={17} />}
        </button>
      </form>
      <div className={s.help}>
        Staff access is managed by your administrator.
      </div>
    </section>
  );
}
