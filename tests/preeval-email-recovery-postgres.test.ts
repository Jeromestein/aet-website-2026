import postgres from "postgres";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Opt-in integration suite for a disposable, loopback-only test database. Never
// uses PREEVAL_DATABASE_URL or .env.local; every provider call is injected.
const m = vi.hoisted(() => ({ sql: undefined as unknown as ReturnType<typeof postgres> }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/preeval/db", () => ({ db: () => m.sql, table: (name: string) => m.sql(name) }));
vi.mock("../lib/preeval/config", () => ({
  configuration: () => ({ cloudPreview: true, recipient: "test@example.invalid", origin: "http://localhost:3022" }),
  required: () => "synthetic-sender",
}));
vi.mock("../lib/preeval/email-template", () => ({ customerEmail: async () => ({ subject: "Synthetic", html: "Synthetic" }) }));
import { recoverApplicationEmails } from "../lib/preeval/email-recovery";
import { flushEmails } from "../lib/preeval/email";

const connection = process.env.PREEVAL_EMAIL_TEST_DATABASE_URL;
const id = "264b791e-b806-4b52-b79e-5229b7224df0";
const other = "264b791e-b806-4b52-b79e-5229b7224df1";
const rowId = "264b791e-b806-4b52-b79e-5229b7224df2";

describe.skipIf(!connection)("email recovery with disposable PostgreSQL", () => {
  beforeAll(async () => {
    const target = new URL(connection!);
    if (target.hostname !== "127.0.0.1" || !/^\/aet_email_recovery_test_[a-z0-9_]+$/.test(target.pathname)) {
      throw new Error("Integration tests require a disposable loopback email-recovery database");
    }
    m.sql = postgres(connection!, { max: 5, connection: { statement_timeout: 5000 } });
    // Refuse to reuse an existing schema so this suite cannot erase prior data.
    await m.sql`create schema preeval`;
    await m.sql`create table preeval.applications(id uuid primary key, status text, payment_status text, result_version integer, result jsonb)`;
    await m.sql`create table preeval.educations(application_id uuid, id integer,school_name text,degree_obtained text,country_of_study text,start_date text,end_date text)`;
    await m.sql`create table preeval.emails(id uuid primary key default gen_random_uuid(), application_id uuid not null,
      kind text not null default 'result', result_version integer default 2, recipient text not null default 'test@example.invalid',
      state text not null default 'failed' check(state in ('queued','failed','sending','sent')),
      attempts integer not null default 1, available_at timestamptz not null default now(),
      first_attempt_at timestamptz default now()-interval '1 hour', payload_hash text, locked_at timestamptz, lease uuid,
      error text,provider_id text,sent_at timestamptz,created_at timestamptz not null default now())`;
  });
  beforeEach(async () => {
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ENABLED", "true"); vi.stubEnv("PREEVAL_EMAIL_ENABLED", "true");
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ORIGIN", "http://localhost:3022");
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_RECIPIENT", "test@example.invalid");
    vi.stubEnv("PREEVAL_EMAIL_RECOVERY_APPLICATION_IDS", id);
    await m.sql`truncate preeval.emails,preeval.applications`;
    await m.sql`insert into preeval.applications values(${id},'completed','paid',2,'{}')`;
    await m.sql`insert into preeval.emails(id,application_id) values(${rowId},${id})`;
  });
  afterEach(() => vi.unstubAllEnvs());
  afterAll(async () => { if (m.sql) await m.sql.end(); });

  it("delivers a completed application's outbox without any AI tables", async () => {
    const send = vi.fn().mockResolvedValue("mock-provider");
    expect(await recoverApplicationEmails(send)).toMatchObject({ attempted: 1, sent: 1 });
    await recoverApplicationEmails(send); expect(send).toHaveBeenCalledTimes(1);
  });
  it("serializes concurrent cron and customer claims in PostgreSQL", async () => {
    let finish!: () => void;
    const send = vi.fn(() => new Promise<string>(resolve => { finish = () => resolve("mock-provider"); }));
    const first = recoverApplicationEmails(send);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await Promise.all([recoverApplicationEmails(send), flushEmails(send, id), recoverApplicationEmails(send)]);
    expect(send).toHaveBeenCalledTimes(1); finish(); await first;
    const [row] = await m.sql`select state,attempts from preeval.emails where id=${rowId}`;
    expect(row).toMatchObject({ state: "sent", attempts: 2 });
  });
  it("uses SKIP LOCKED without blocking another invocation", async () => {
    let unlock!: () => void;
    let ready!: () => void;
    const locked = new Promise<void>(resolve => { ready = resolve; });
    const transaction = m.sql.begin(async tx => {
      await tx`select id from preeval.emails for update`;
      ready(); await new Promise<void>(resolve => { unlock = resolve; });
    });
    await locked;
    const send = vi.fn();
    try { expect(await recoverApplicationEmails(send)).toMatchObject({ attempted: 0, sent: 0 }); }
    finally { unlock(); await transaction; }
    expect(send).not.toHaveBeenCalled();
  });
  it("retains a stable key/hash after uncertain acceptance and honors backoff", async () => {
    const accepted = new Set<string>();
    const send = vi.fn(async mail => {
      if (!accepted.has(mail.id)) { accepted.add(mail.id); throw new Error("Accepted, then lost response"); }
      return "same-provider-id";
    });
    await recoverApplicationEmails(send);
    const [first] = await m.sql`select * from preeval.emails`;
    expect(first.state).toBe("failed"); expect(first.payload_hash).toMatch(/^[a-f0-9]{64}$/);
    await recoverApplicationEmails(send); expect(send).toHaveBeenCalledTimes(1);
    await m.sql`update preeval.emails set available_at=now()-interval '1 second'`;
    await recoverApplicationEmails(send);
    const [last] = await m.sql`select * from preeval.emails`;
    expect(last.state).toBe("sent"); expect(accepted.size).toBe(1);
    expect(last.first_attempt_at).toEqual(first.first_attempt_at); expect(last.payload_hash).toBe(first.payload_hash);
  });
  it("quarantines expired leases and windows while preserving sent receipts", async () => {
    await m.sql`update preeval.emails set state='sending',locked_at=now()-interval '4 minutes',first_attempt_at=now()-interval '23 hours'`;
    await m.sql`insert into preeval.emails(application_id,state,provider_id,first_attempt_at) values(${id},'sent','keep-me',now()-interval '48 hours')`;
    const send = vi.fn();
    expect(await recoverApplicationEmails(send)).toMatchObject({ attempted: 0, reviewRequired: 1 });
    const [row] = await m.sql`select state,error,available_at::text from preeval.emails where id=${rowId}`;
    expect(row).toMatchObject({ state: "failed", error: "delivery_window_expired_review", available_at: "infinity" });
    await recoverApplicationEmails(send); expect(send).not.toHaveBeenCalled();
    expect((await m.sql`select provider_id from preeval.emails where state='sent'`)[0].provider_id).toBe("keep-me");
  });
  it("recovers stale leases within the window and parks exhausted attempts", async () => {
    await m.sql`update preeval.emails set state='sending',lease=gen_random_uuid(),locked_at=now()-interval '4 minutes'`;
    expect(await recoverApplicationEmails(vi.fn().mockResolvedValue("mock"))).toMatchObject({ sent: 1 });
    await m.sql`insert into preeval.emails(application_id,attempts) values(${id},5)`;
    expect(await recoverApplicationEmails(vi.fn())).toMatchObject({ attempted: 0, reviewRequired: 1 });
  });
  it("limits claims/reviews and never touches another recipient or application", async () => {
    await m.sql`insert into preeval.emails(application_id) select ${id}::uuid from generate_series(1,12)`;
    await m.sql`insert into preeval.emails(application_id,recipient) values(${other},'test@example.invalid'),(${id},'old@example.invalid')`;
    expect(await recoverApplicationEmails(vi.fn().mockResolvedValue("mock"))).toMatchObject({ attempted: 5, sent: 5 });
    expect((await m.sql`select count(*)::int as count from preeval.emails where state='failed'`)[0].count).toBe(10);
    await m.sql`update preeval.emails set attempts=5 where state='failed'`;
    expect(await recoverApplicationEmails(vi.fn())).toMatchObject({ attempted: 0, reviewRequired: 5 });
    expect((await m.sql`select count(*)::int as count from preeval.emails where available_at='infinity'`)[0].count).toBe(5);
    expect((await m.sql`select count(*)::int as count from preeval.emails where (application_id=${other} or recipient='old@example.invalid') and available_at<>'infinity'`)[0].count).toBe(2);
  });
  it("blocks a superseded result or changed template before provider contact", async () => {
    const send = vi.fn();
    await m.sql`update preeval.applications set result_version=3`;
    expect(await recoverApplicationEmails(send)).toMatchObject({ attempted: 0, reviewRequired: 1 });
    await m.sql`update preeval.applications set result_version=2`;
    await m.sql`insert into preeval.emails(application_id,payload_hash) values(${id},'old-template')`;
    expect(await recoverApplicationEmails(send)).toMatchObject({ attempted: 0, reviewRequired: 1 }); expect(send).not.toHaveBeenCalled();
  });
});
