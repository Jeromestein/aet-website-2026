import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliveryHash, EmailReviewRequired, type OutgoingEmail } from "../lib/email/delivery";

const m = vi.hoisted(() => ({ query: vi.fn(), cloud: false, recipient: "approved@example.invalid" }));
vi.mock("../lib/preeval/db", () => {
  const sql = Object.assign(
    (parts: TemplateStringsArray, ...values: unknown[]) => m.query(parts.join("?"), values),
    { json: (value: unknown) => value },
  );
  return { db: () => sql, table: (name: string) => name };
});
vi.mock("../lib/preeval/config", () => ({
  configuration: () => ({ cloudPreview: m.cloud, recipient: m.recipient, origin: "http://localhost:3022", admin: "admin@example.invalid" }),
  required: (key: string) => ({ RESEND_DEFAULT_FROM_NAME: "AET", RESEND_DEFAULT_FROM_ADDRESS: "sender@example.invalid" })[key] || "test-key",
}));
vi.mock("../lib/preeval/auth", () => ({ hash: (value: string) => "hashed-" + value }));
import { applicationEmail, enqueueEmail, flushEmails, renderQueuedEmail, deliverApplicationEmails } from "../lib/preeval/email";

const app = {
  id: "264b791e-b806-4b52-b79e-5229b7224df0", first_name: "Current applicant", last_name: "Test",
  locale: "en", payment_status: "paid", status: "completed", result_version: 2,
  result: { result: "Current degree", reasoning: "Current assessment" },
};
const education = { school_name: "Current school", country_of_study: "GB", degree_obtained: "Current qualification", start_date: "2018", end_date: "2022" };
const row = { id: "mail-1", application_id: app.id, kind: "confirmation", recipient: m.recipient, payload_hash: null };

function arrange(overrides: Record<string, unknown> = {}) {
  m.query.mockImplementation(async (query: string) => {
    if (query.startsWith("select * from")) return [{ ...app, ...overrides }];
    if (query.startsWith("select school_name")) return [education];
    if (query.startsWith("select detail")) return [{ message: "Original request: please provide a transcript." }];
    if (query.startsWith("select hash")) return [{ hash: "valid" }];
    if (query.includes("set payload_hash=")) return [{ id: row.id }];
    return [];
  });
}
beforeEach(() => { vi.resetAllMocks(); m.cloud = false; vi.stubEnv("PREEVAL_EMAIL_ENABLED", "false"); arrange(); });
afterEach(() => vi.unstubAllEnvs());

describe("metadata-only delivery queue", () => {
  it("queues a result version without rendering or storing a message", async () => {
    await applicationEmail(app, "result");
    expect(m.query).toHaveBeenCalledTimes(1);
    const [query, values] = m.query.mock.calls[0];
    expect(query).not.toMatch(/\b(html|subject)\b/);
    expect(values).toContain(`result:${app.id}:2`);
    expect(values).toContain(2);
    expect(values).not.toContain(app.result.result);
  });
  it("queues an information request by business-record ID only", async () => {
    await applicationEmail(app, "information", 51);
    expect(m.query.mock.calls[0][1]).toContain(51);
    await expect(applicationEmail(app, "information")).rejects.toThrow("Missing information request");
  });
  it("reads applicant and education data when rendering", async () => {
    const content = await renderQueuedEmail(row);
    expect(content.html).toContain("Current applicant");
    expect(content.html).toContain("Current school");
    expect(content.html).toContain("$19.88");
  });
  it("loads the referenced information request from business history", async () => {
    const content = await renderQueuedEmail({ ...row, kind: "information", information_request_id: 51 });
    expect(content.html).toContain("Original request: please provide a transcript.");
    const [, values] = m.query.mock.calls.find(([query]) => query.startsWith("select detail"))!;
    expect(values).toContain(51);
    expect(values).toContain(app.id);
  });
  it("does not substitute a newer result for an older queued result", async () => {
    await expect(renderQueuedEmail({ ...row, kind: "result", result_version: 1 })).rejects.toThrow("result_superseded_or_withheld");
  });
  it.each([{ payment_status: "refunded" }, { status: "cancelled" }, { status: "needs_information" }, { result: null }])(
    "does not send results withheld since enqueue: %j", async overrides => {
      arrange(overrides);
      await expect(renderQueuedEmail({ ...row, kind: "result", result_version: 2 })).rejects.toThrow("result_superseded_or_withheld");
    },
  );
  it("renders a currently releasable referenced result", async () => {
    const content = await renderQueuedEmail({ ...row, kind: "result", result_version: 2 });
    expect(content.html).toContain("Current degree");
  });
  it("rejects a different recipient rather than redirecting queued mail", async () => {
    await expect(renderQueuedEmail({ ...row, recipient: "other@example.invalid" })).rejects.toThrow("recipient_changed");
  });
  it("rejects historical administrator messages before reading application data", async () => {
    await expect(renderQueuedEmail({ ...row, kind: "admin_access" })).rejects.toThrow("unknown_email_kind");
    expect(m.query).not.toHaveBeenCalled();
  });
});

describe("delivery retries", () => {
  const mail: OutgoingEmail = { id: "mail-1", from: "AET <sender@example.invalid>", recipient: m.recipient, subject: "Test", html: "<p>Original</p>" };
  it("retains a digest only and accepts identical retry content", () => {
    const digest = deliveryHash(mail);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(deliveryHash(mail, digest)).toBe(digest);
    expect(() => deliveryHash({ ...mail, html: "<p>Changed</p>" }, digest)).toThrow(EmailReviewRequired);
  });
  it("keeps the cloud-preview worker paused even with an injected transport", async () => {
    m.cloud = true;
    const send = vi.fn();
    await flushEmails(send);
    expect(m.query).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it.each([undefined, "", "not-an-application-id"])("cannot drain the cloud queue without a valid scope: %s", async id => {
    m.cloud = true; vi.stubEnv("PREEVAL_EMAIL_ENABLED", "true");
    const send = vi.fn(); await flushEmails(send, id);
    expect(m.query).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
  it("keeps a scoped cloud send disabled without opt-in", async () => {
    m.cloud = true;
    await flushEmails(vi.fn(), app.id);
    expect(m.query).not.toHaveBeenCalled();
  });
  it("scopes cloud claims and stale-lease recovery to the application and recipient", async () => {
    m.cloud = true; vi.stubEnv("PREEVAL_EMAIL_ENABLED", "true");
    const base = m.query.getMockImplementation()!;
    m.query.mockImplementation((query, values) => query.includes("set state='sending'") ? [row] : base(query, values));
    const send = vi.fn().mockResolvedValue("provider-scoped");
    await flushEmails(send, app.id);
    expect(send).toHaveBeenCalledTimes(1);
    const claims = m.query.mock.calls.filter(([query]) => query.includes("set state='sending'") || query.includes("error='interrupted'"));
    expect(claims).toHaveLength(2);
    for (const [query, values] of claims) {
      expect(query).toContain("application_id="); expect(query).toContain("recipient=");
      expect(values).toContain(app.id); expect(values).toContain(m.recipient);
    }
  });
  it("contains database dispatch failures without invalidating saved work", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    m.query.mockRejectedValue(new Error("private connection details"));
    await expect(deliverApplicationEmails(app.id)).resolves.toBeUndefined();
    expect(JSON.stringify(log.mock.calls)).not.toContain("private connection");
    log.mockRestore();
  });
  it("sends rendered content but only persists its digest and delivery result", async () => {
    const base = m.query.getMockImplementation()!;
    m.query.mockImplementation((query, values) => query.includes("set state='sending'") ? [row] : base(query, values));
    const send = vi.fn().mockResolvedValue("provider-1");
    await flushEmails(send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({ id: row.id, recipient: row.recipient });
    const writes = m.query.mock.calls.filter(([query]) => query.startsWith("update"));
    expect(writes.every(([query]) => !/\b(html|subject)\s*=/.test(query))).toBe(true);
    expect(writes.some(([query, values]) => query.includes("provider_id=") && values.includes("provider-1"))).toBe(true);
  });
  it("does not call the provider when a retry's rendered content changed", async () => {
    const base = m.query.getMockImplementation()!;
    m.query.mockImplementation((query, values) => query.includes("set state='sending'") ? [{ ...row, payload_hash: "old-content-digest" }] : base(query, values));
    const send = vi.fn();
    await flushEmails(send);
    expect(send).not.toHaveBeenCalled();
    expect(m.query.mock.calls.some(([query, values]) => query.includes("set state='failed'") && values.includes("email_content_changed"))).toBe(true);
  });
  it("retains transient failure state for retry instead of storing provider errors or HTML", async () => {
    const base = m.query.getMockImplementation()!;
    m.query.mockImplementation((query, values) => query.includes("set state='sending'") ? [row] : base(query, values));
    await flushEmails(async () => { throw new Error("provider response containing private data"); });
    const failure = m.query.mock.calls.find(([query, values]) => query.includes("set state='failed'") && values.includes("delivery_failed"))!;
    expect(failure[1]).toContain("delivery_failed");
    expect(failure[1]).not.toContain("provider response containing private data");
    expect(failure[0]).toContain("60 seconds");
  });
});
