import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialData } from "../lib/evaluation-application/domain";
import { feeUpdateEmail, paymentConfirmationEmail } from "../lib/evaluation-application/email-template";
vi.mock("server-only", () => ({}));
const m = vi.hoisted(() => ({ query: vi.fn(), application: vi.fn(), cloud: false }));
vi.mock("../lib/preeval/db", () => ({ db: () => (parts: TemplateStringsArray, ...values: unknown[]) => m.query(parts.join("?"), values), table: (name: string) => name }));
vi.mock("../lib/evaluation-application/service", () => ({ application: m.application }));
vi.mock("../lib/preeval/config", () => ({ configuration: () => ({ cloudPreview: m.cloud, recipient: "approved@example.invalid", origin: "http://localhost:3022" }), required: () => "test" }));
import { flushFormalEmails, renderFormalEmail } from "../lib/evaluation-application/email";
const data = initialData(); data.client.name = "Current <Applicant>"; data.client.office = "Miami"; data.services.document.tier = "standard";
const app = { id: "264b791e-b806-4b52-b79e-5229b7224df0", locale: "en", data, status: "submitted", payment_status: "paid", confirmed_quote: {base:11000, additional:5000, total:16000, explanation:"Translation"} };
const receipt = { id: "payment-1", status: "paid", amount_cents: 16000, paid_at: "2026-10-20T15:30:00Z" };
const row = { id: "mail-1", application_id: app.id, kind: "payment", recipient: "approved@example.invalid", payment_id: receipt.id, payload_hash: null };
beforeEach(() => { vi.resetAllMocks(); m.cloud = false; m.application.mockResolvedValue(app); m.query.mockResolvedValue([receipt]); });
describe("formal business templates", () => {
  it("uses the confirmed payment amount and date without inventing a completion date", async () => {
    const mail = await paymentConfirmationEmail(app, receipt, "https://example.invalid");
    expect(mail.html).toContain("$160.00"); expect(mail.html).toContain("Oct 20, 2026"); expect(mail.html).toContain("Current &lt;Applicant&gt;");
    expect(mail.html).not.toContain("Estimated completion"); expect(mail.html).toContain("payment-1");
  });
  it.each([{status:"open"}, {status:"refunded"}, {paid_at:""}, {amount_cents:0}, {amount_cents:1.5}])("rejects invalid receipt %j", async change => {
    await expect(paymentConfirmationEmail(app, {...receipt, ...change}, "https://example.invalid")).rejects.toThrow();
  });
  it("shows pending quotes without a payment request", async () => {
    const {html} = await feeUpdateEmail(app, {total:null, explanation:"Reviewing documents"}, "https://example.invalid");
    expect(html).toContain("QUOTE IN REVIEW"); expect(html).toContain("No payment is requested"); expect(html).not.toContain("Review Fee &amp; Payment Options"); expect(html).not.toContain("$0.00");
  });
});
describe("formal delivery records", () => {
  it("reads the referenced confirmed payment and current applicant", async () => {
    expect((await renderFormalEmail(row)).html).toContain("Current &lt;Applicant&gt;");
    expect(m.query.mock.calls[0][1]).toContain(receipt.id); expect(m.query.mock.calls[0][1]).toContain(app.id);
  });
  it.each(["partially_refunded","refunded","unpaid"])("blocks receipts when application is %s", async status => {
    m.application.mockResolvedValue({...app,payment_status:status});
    await expect(renderFormalEmail(row)).rejects.toThrow("payment_receipt_unavailable");
  });
  it("blocks old quotes after an update", async () => {
    m.application.mockResolvedValue({...app,payment_status:"unpaid"});
    m.query.mockResolvedValue([{detail:{...app.confirmed_quote,additional:4000}}]);
    await expect(renderFormalEmail({...row,kind:"fee_update",audit_id:7})).rejects.toThrow("fee_update_superseded");
  });
  it("renders the matching current quote", async () => {
    m.application.mockResolvedValue({...app,payment_status:"unpaid"}); m.query.mockResolvedValue([{detail:app.confirmed_quote}]);
    expect((await renderFormalEmail({...row,kind:"fee_update",audit_id:7})).html).toContain("$160.00");
  });
  it("keeps cloud-preview sending paused", async () => {
    m.cloud=true; const send=vi.fn(); await flushFormalEmails(send); expect(send).not.toHaveBeenCalled(); expect(m.query).not.toHaveBeenCalled();
  });
  it("does not send changed content on retry", async () => {
    m.query.mockImplementation(async (query:string) => query.includes("set state='sending'") ? [{...row,payload_hash:"old-digest"}] : query.startsWith("select id,amount_cents") ? [receipt] : []);
    const send=vi.fn(); await flushFormalEmails(send); expect(send).not.toHaveBeenCalled();
    expect(m.query.mock.calls.some(([,values])=>values.includes("email_content_changed"))).toBe(true);
  });
  it("passes content to delivery but only persists its digest and result", async () => {
    m.query.mockImplementation(async (query:string) => query.includes("set state='sending'") ? [row] : query.startsWith("select id,amount_cents") ? [receipt] : query.includes("set payload_hash=") ? [{id:row.id}] : []);
    const send=vi.fn().mockResolvedValue("provider-1"); await flushFormalEmails(send); expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].html).toContain("$160.00");
    expect(send.mock.calls[0][0].cc).toEqual(["info@americantranslationservice.com"]);
    expect(m.query.mock.calls.filter(([query])=>query.startsWith("update")).every(([query])=>!/\b(html|subject)\s*=/.test(query))).toBe(true);
  });
});
