import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OutgoingEmail } from "../lib/email/delivery";

const m = vi.hoisted(() => ({ query: vi.fn(), cloud: true, recipient: "approved@example.invalid", origin: "http://localhost:3022", environmentError: false }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/preeval/db", () => ({
  db: () => (parts: TemplateStringsArray, ...values: unknown[]) => m.query(parts.join("?"), values),
  table: (name: string) => name,
}));
vi.mock("../lib/preeval/config", () => ({
  configuration: () => {
    if (m.environmentError) throw new Error("Private configuration rejected");
    return { cloudPreview: m.cloud, recipient: m.recipient, origin: m.origin };
  },
  required: (key: string) => ({ RESEND_DEFAULT_FROM_NAME: "AET", RESEND_DEFAULT_FROM_ADDRESS: "sender@example.invalid" })[key],
}));
vi.mock("../lib/preeval/email-template", () => ({ customerEmail: async (app: { result: string }) => ({ subject: "Result", html: app.result }) }));
// A recovery regression must never enter the AI pipeline or query its jobs.
vi.mock("../lib/preeval/ai-jobs", () => ({ dueAIJobs: () => { throw new Error("AI queue must not be used"); } }));
vi.mock("../lib/preeval/ai", () => ({ processAI: () => { throw new Error("AI must not be run"); } }));
import { recoverApplicationEmails, emailRecoveryScope } from "../lib/preeval/email-recovery";
import { flushEmails } from "../lib/preeval/email";
import { GET } from "../app/api/internal/pre-evaluation/email-recovery/route";

const id = "264b791e-b806-4b52-b79e-5229b7224df0";
const second = "264b791e-b806-4b52-b79e-5229b7224df1";
const now = Date.parse("2026-10-22T12:00:00Z");
const hour = 3600000;
type RecordRow = Record<string, any>;
let rows: RecordRow[];
let app: RecordRow;
let saveReceiptFails: boolean;
let fenceFails: boolean;

// Stateful SQL boundary double: claims mutate synchronously before a provider can
// yield. SQL guards are also asserted below; this is not a live database test.
function query(sql: string, values: any[]) {
  if (sql.startsWith("select application_id")) {
    return [...new Set(rows.filter(r => values[1].includes(r.application_id) && r.recipient === values[2] && r.available_at !== Infinity &&
      ((["queued", "failed"].includes(r.state) && r.available_at <= now) || (r.state === "sending" && r.locked_at < now - 180000)))
      .map(r => r.application_id))].slice(0, 3).map(application_id => ({ application_id }));
  }
  const scope = values.find(value => value === id || value === second);
  const scoped = rows.filter(r => (!scope || r.application_id === scope) && r.recipient === m.recipient);
  if (sql.includes("error=case when first_attempt_at")) {
    const reviewed = scoped.filter(r => (["queued", "failed"].includes(r.state) || (r.state === "sending" && r.locked_at < now - 180000)) &&
      r.available_at !== Infinity && (r.attempts >= 5 || (r.first_attempt_at !== null && r.first_attempt_at <= now - 23 * hour))).slice(0, 5);
    for (const r of reviewed) Object.assign(r, { state: "failed", available_at: Infinity, lease: null, error: "review" });
    return reviewed;
  }
  if (sql.includes("error='interrupted'")) {
    for (const r of scoped.filter(r => r.state === "sending" && r.locked_at < now - 180000 && r.attempts < 5 && r.first_attempt_at > now - 23 * hour).slice(0, 5))
      Object.assign(r, { state: "failed", lease: null });
    return [];
  }
  if (sql.includes("set state='sending'")) {
    const claimed = scoped.filter(r => ["queued", "failed"].includes(r.state) && r.attempts < 5 && r.available_at <= now &&
      (r.first_attempt_at === null || r.first_attempt_at > now - 23 * hour)).slice(0, 5);
    for (const r of claimed) Object.assign(r, { state: "sending", lease: values[1], attempts: r.attempts + 1, locked_at: now, first_attempt_at: r.first_attempt_at ?? now });
    return claimed.map(r => ({ ...r }));
  }
  if (sql.startsWith("select * from")) return [app];
  if (sql.startsWith("select school_name")) return [];
  if (sql.includes("set payload_hash=")) {
    const r = rows.find(r => r.id === values[2] && r.lease === values[3]);
    if (!r || fenceFails) return [];
    r.payload_hash = values[1];
    return [{ id: r.id }];
  }
  if (sql.includes("set state='sent'")) {
    if (saveReceiptFails) throw new Error("DB disconnected after provider success");
    const r = rows.find(r => r.id === values[2] && r.lease === values[3]);
    if (!r) return [];
    Object.assign(r, { state: "sent", provider_id: values[1], lease: null });
    return [{ id: r.id }];
  }
  if (sql.includes("set state='failed'")) {
    const r = rows.find(r => r.id === values[3] && r.lease === values[4]);
    if (r) Object.assign(r, { state: "failed", error: values[1], available_at: values[2] ? Infinity : now + 60000, lease: null });
    return [];
  }
  throw new Error("Unexpected SQL in recovery test: " + sql);
}
function delivery(overrides: RecordRow = {}) {
  return { id: "mail-1", application_id: id, kind: "result", result_version: 2, recipient: m.recipient,
    state: "failed", attempts: 1, available_at: now, first_attempt_at: now - hour, payload_hash: null, ...overrides };
}
beforeEach(() => {
  vi.resetAllMocks();
  m.cloud = true; m.recipient = "approved@example.invalid"; m.origin = "http://localhost:3022"; m.environmentError = false;
  vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ENABLED", "true"); vi.stubEnv("PREEVAL_EMAIL_ENABLED", "true");
  vi.stubEnv("PREEVAL_EMAIL_RECOVERY_APPLICATION_IDS", id);
  vi.stubEnv("PREEVAL_EMAIL_RECOVERY_RECIPIENT", m.recipient); vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ORIGIN", m.origin);
  vi.stubEnv("PREEVAL_AI_ENABLED", "false"); vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("CRON_SECRET", "synthetic-recovery-secret");
  rows = [delivery()]; app = { id, status: "completed", payment_status: "paid", result_version: 2, result: "Original result" };
  saveReceiptFails = false; fenceFails = false;
  m.query.mockImplementation(query);
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("independent bounded email recovery", () => {
  it("delivers failed mail after AI completion, with AI disabled and no page request", async () => {
    const provider = vi.fn().mockResolvedValue("provider-1");
    expect(await recoverApplicationEmails(provider)).toEqual({ applications: 1, attempted: 1, sent: 1, reviewRequired: 0, dispatchErrors: 0 });
    expect(rows[0].state).toBe("sent");
    await recoverApplicationEmails(provider);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(m.query.mock.calls.every(([sql]) => !sql.includes("ai_jobs"))).toBe(true);
  });
  it.each(["PREEVAL_EMAIL_RECOVERY_ENABLED", "PREEVAL_EMAIL_ENABLED"])("requires explicit %s opt-in", async key => {
    vi.stubEnv(key, "false");
    expect(await recoverApplicationEmails(vi.fn())).toEqual({ skipped: true }); expect(m.query).not.toHaveBeenCalled();
  });
  it.each(["", "*", "not-an-id", id + ",", Array(21).fill(id).join(",")])("rejects unbounded or invalid application scope: %s", async ids => {
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_APPLICATION_IDS", ids);
    await expect(recoverApplicationEmails(vi.fn())).rejects.toThrow("explicit application IDs"); expect(m.query).not.toHaveBeenCalled();
  });
  it("normalizes and deduplicates explicit UUID scope", () => {
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_APPLICATION_IDS", ` ${id.toUpperCase()},${id}`);
    expect(emailRecoveryScope()?.ids).toEqual([id]);
  });
  it.each(["recipient", "origin"] as const)("fails closed after the configured %s changes", async key => {
    m[key] = "changed";
    await expect(recoverApplicationEmails(vi.fn())).rejects.toThrow("environment requires review"); expect(m.query).not.toHaveBeenCalled();
  });
  it("retains database/environment validation before accessing the outbox", async () => {
    m.environmentError = true;
    await expect(recoverApplicationEmails(vi.fn())).rejects.toThrow("configuration rejected"); expect(m.query).not.toHaveBeenCalled();
  });
  it("does not claim another application or recipient", async () => {
    rows = [delivery({ application_id: second }), delivery({ recipient: "old@example.invalid" })];
    const provider = vi.fn();
    expect(await recoverApplicationEmails(provider)).toMatchObject({ applications: 0, attempted: 0 }); expect(provider).not.toHaveBeenCalled();
  });
  it("caps each application's claim at five and preserves SQL locking and scope", async () => {
    rows = Array.from({ length: 9 }, (_, n) => delivery({ id: "mail-" + n }));
    expect(await recoverApplicationEmails(vi.fn().mockResolvedValue("provider"))).toMatchObject({ attempted: 5, sent: 5 });
    const candidate = m.query.mock.calls.find(([sql]) => sql.startsWith("select application_id"))!;
    expect(candidate[0]).toContain("limit 3"); expect(candidate[1]).toContainEqual([id]);
    for (const [sql, values] of m.query.mock.calls.filter(([sql]) => sql.includes("for update skip locked"))) {
      expect(sql).toContain("limit 5"); expect(sql).toContain("application_id="); expect(sql).toContain("recipient=");
      expect(values).toContain(id); expect(values).toContain(m.recipient);
    }
  });
  it("overlapping recovery and customer sends share the same claim", async () => {
    let finish!: () => void;
    const provider = vi.fn(() => new Promise<string>(resolve => { finish = () => resolve("provider-1"); }));
    const first = recoverApplicationEmails(provider);
    await vi.waitFor(() => expect(provider).toHaveBeenCalledTimes(1));
    await Promise.all([recoverApplicationEmails(provider), flushEmails(provider, id)]);
    expect(provider).toHaveBeenCalledTimes(1);
    finish(); await first; expect(rows[0].state).toBe("sent");
  });
  it("reclaims interrupted sends without replacing their idempotency key", async () => {
    rows[0] = delivery({ state: "sending", locked_at: now - 180001, lease: "lost" });
    const provider = vi.fn().mockResolvedValue("original-provider-id");
    await recoverApplicationEmails(provider);
    expect(provider.mock.calls[0][0].id).toBe("mail-1"); expect(rows[0].attempts).toBe(2);
  });
  it.each(["provider_timeout", "receipt_write_failed"])("reconciles uncertain %s with the original key and identical payload", async mode => {
    const accepted = new Map<string, { mail: OutgoingEmail; receipt: string }>();
    let uncertain = true;
    const provider = vi.fn(async (mail: OutgoingEmail) => {
      const existing = accepted.get(mail.id);
      if (existing) { expect(mail).toEqual(existing.mail); return existing.receipt; }
      accepted.set(mail.id, { mail, receipt: "accepted-once" });
      if (uncertain && mode === "provider_timeout") throw new Error("Response lost after acceptance");
      return "accepted-once";
    });
    saveReceiptFails = mode === "receipt_write_failed";
    await recoverApplicationEmails(provider);
    expect(rows[0].state).toBe("failed");
    await recoverApplicationEmails(provider); expect(provider).toHaveBeenCalledTimes(1); // Backoff.
    uncertain = false; saveReceiptFails = false; rows[0].available_at = now;
    await recoverApplicationEmails(provider);
    expect(accepted.size).toBe(1); expect(provider).toHaveBeenCalledTimes(2);
    expect(rows[0]).toMatchObject({ state: "sent", provider_id: "accepted-once", first_attempt_at: now - hour });
  });
  it.each([23, 24, 48])("quarantines uncertain mail at %s hours without any provider request", async hours => {
    rows[0] = delivery({ state: "sending", locked_at: now - hour, first_attempt_at: now - hours * hour, payload_hash: "original" });
    const provider = vi.fn();
    expect(await recoverApplicationEmails(provider)).toMatchObject({ attempted: 0, reviewRequired: 1 });
    expect(rows[0].available_at).toBe(Infinity); expect(rows[0].first_attempt_at).toBe(now - hours * hour);
    await recoverApplicationEmails(provider); expect(provider).not.toHaveBeenCalled();
  });
  it("quarantines exhausted attempts and retains already blocked/sent records", async () => {
    rows = [delivery({ attempts: 5 }), delivery({ id: "blocked", available_at: Infinity, error: "email_content_changed" }), delivery({ id: "sent", state: "sent", provider_id: "preserved" })];
    const before = JSON.stringify(rows.slice(1));
    expect(await recoverApplicationEmails(vi.fn())).toMatchObject({ attempted: 0, reviewRequired: 1 });
    expect(JSON.stringify(rows.slice(1))).toBe(before);
  });
  it("parks a fifth failed send rather than making a sixth attempt", async () => {
    rows[0].attempts = 4;
    const provider = vi.fn().mockRejectedValue(new Error("uncertain"));
    expect(await recoverApplicationEmails(provider)).toMatchObject({ attempted: 1, reviewRequired: 1 });
    await recoverApplicationEmails(provider); expect(provider).toHaveBeenCalledTimes(1); expect(rows[0].available_at).toBe(Infinity);
  });
  it.each([{ result_version: 3 }, { status: "needs_information" }, { payment_status: "refunded" }])("blocks a superseded/withheld result: %j", async change => {
    Object.assign(app, change);
    const provider = vi.fn();
    expect(await recoverApplicationEmails(provider)).toMatchObject({ reviewRequired: 1, attempted: 0 });
    expect(provider).not.toHaveBeenCalled(); expect(rows[0].error).toBe("result_superseded_or_withheld");
  });
  it("blocks changed templates or sender payloads on retry", async () => {
    rows[0].payload_hash = "previous-template-digest";
    const provider = vi.fn(); await recoverApplicationEmails(provider);
    expect(provider).not.toHaveBeenCalled(); expect(rows[0].error).toBe("email_content_changed");
  });
  it("rechecks lease and retry window after rendering, before provider dispatch", async () => {
    fenceFails = true;
    const provider = vi.fn(); await recoverApplicationEmails(provider); expect(provider).not.toHaveBeenCalled();
    const sql = m.query.mock.calls.find(([sql]) => sql.includes("set payload_hash="))![0];
    expect(sql).toContain("and lease="); expect(sql).toContain("locked_at>=now()-interval '3 minutes'");
    expect(sql).toContain("first_attempt_at>now()-interval '23 hours'");
  });
});

const request = (authorization = "Bearer synthetic-recovery-secret") => new Request("https://example.test/api/internal/pre-evaluation/email-recovery", { headers: { authorization } });
describe("email recovery endpoint", () => {
  it.each(["", "Bearer wrong", "Bearer synthetic-recovery-secreX"])("rejects invalid authorization %s before database access", async auth => {
    expect((await GET(request(auth))).status).toBe(401); expect(m.query).not.toHaveBeenCalled();
  });
  it.each(["", "short"])("rejects an absent/weak configured secret: %s", async secret => {
    vi.stubEnv("CRON_SECRET", secret);
    expect((await GET(request("Bearer " + secret))).status).toBe(401); expect(m.query).not.toHaveBeenCalled();
  });
  it("returns a no-store skip when disabled", async () => {
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ENABLED", "false");
    const response = await GET(request());
    expect(await response.json()).toEqual({ skipped: true }); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(m.query).not.toHaveBeenCalled();
  });
  it("handles empty outboxes without any AI prerequisite", async () => {
    rows = [];
    const response = await GET(request()); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ applications: 0, attempted: 0 });
  });
  it("reports per-application database errors without private details", async () => {
    m.query.mockImplementation((sql, values) => {
      if (sql.startsWith("select application_id")) return [{ application_id: id }];
      throw new Error("Private database URL: " + values);
    });
    const response = await GET(request()); expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ dispatchErrors: 1, attempted: 0 });
  });
  it("returns a sanitized failure if selection or configuration fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    m.query.mockRejectedValue(new Error("Private database URL"));
    const response = await GET(request()); expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "email_recovery_failed" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("Private database");
  });
});
