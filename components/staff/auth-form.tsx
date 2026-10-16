"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, ArrowRight } from "lucide-react";
import s from "./auth.module.css";
export default function StaffAuthForm({
  mode = "login",
  returnTo = "/admin/CRM",
  allowEmailFallback = false,
}: {
  allowEmailFallback?: boolean;
  mode?: "login" | "forgot-password" | "reset-password";
  returnTo?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const [visible, setVisible] = useState(false),
    [replacement, setReplacement] = useState(false),
    [token, setToken] = useState("");
  const consumedFragment = useRef(false);
  useEffect(() => {
    if (consumedFragment.current) return;
    consumedFragment.current = true;
    if (mode === "reset-password") {
      const value =
        new URLSearchParams(location.hash.slice(1)).get("token") || "";
      setToken(/^[a-f0-9]{64}$/.test(value) ? value : "");
      history.replaceState(null, "", location.pathname);
      if (!/^[a-f0-9]{64}$/.test(value))
        setError("This reset link is invalid. Request a new one.");
    }
  }, [mode]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/staff-auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode !== "reset-password"
            ? { email: String(data.get("email") || "").trim() }
            : { token }),
          ...(mode !== "forgot-password"
            ? { password: String(data.get("password") || "") }
            : {}),
          ...(mode === "login"
            ? {
                redirect: returnTo,
                ...(replacement
                  ? { replacement: String(data.get("replacement") || "") }
                  : {}),
              }
            : {}),
        }),
      });
      const result = await response.json();
      if (result.passwordUpdateRequired) setReplacement(true);
      if (!response.ok)
        throw new Error(result.error || "Please try again shortly.");
      if (result.url) {
        location.assign(result.url);
        return;
      }
      setSent(true);
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
      <h1 id="staff-title">
        {mode === "login"
          ? "Welcome back"
          : mode === "forgot-password"
            ? "Reset your password"
            : "Choose a new password"}
      </h1>
      <p className={s.intro}>
        {mode === "login"
          ? "Sign in to manage applications and support your clients."
          : mode === "forgot-password"
            ? "Enter your work email and we’ll send you a reset link."
            : "Use at least 8 characters to secure your staff account."}
      </p>
      {sent ? (
        <p className={s.success} role="status">
          If this email has staff access, a reset link will arrive shortly.
        </p>
      ) : (
        <form onSubmit={submit}>
          {mode !== "reset-password" && (
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
          )}
          {mode !== "forgot-password" && (
            <div className={s.field}>
              <div className={s.labelRow}>
                <label htmlFor="staff-password">
                  {mode === "reset-password" ? "New password" : "Password"}
                </label>
                {mode === "login" && (
                  <a href="/admin/forgot-password">Forgot password?</a>
                )}
              </div>
              <div className={s.password}>
                <input
                  id="staff-password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    mode === "reset-password"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={mode === "reset-password" ? 8 : undefined}
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
          )}
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
          <button
            className={s.submit}
            disabled={busy || (mode === "reset-password" && !token)}
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "forgot-password"
                  ? "Send reset link"
                  : "Save password"}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>
      )}
      <div className={s.help}>
        {mode === "login" ? (
          "Staff access is managed by your administrator."
        ) : (
          <a
            href={
              mode === "reset-password"
                ? "/admin/forgot-password"
                : "/admin/login"
            }
          >
            {mode === "reset-password"
              ? "Request a new reset link"
              : "Back to sign in"}
          </a>
        )}
      </div>
      {mode === "login" && allowEmailFallback && (
        <p className={s.help}>
          <a href="/admin/email-login">Use the previous sign-in method</a>
        </p>
      )}
    </section>
  );
}
