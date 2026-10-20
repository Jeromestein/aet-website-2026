import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_EMAIL_ASSET_ORIGIN, emailAssetOrigin } from "../lib/email/assets";
import { confirmationEmail } from "../lib/application/intake-template";
import { initialDraft } from "../lib/application/model";
import { intakeQuote } from "../lib/application/intake";
import { customerEmail } from "../lib/preeval/email-template";
import { feeUpdateEmail, paymentConfirmationEmail } from "../lib/evaluation-application/email-template";
import { initialData } from "../lib/evaluation-application/domain";

afterEach(() => vi.unstubAllEnvs());
describe("public email assets", () => {
  it("defaults independently of the application origin and supports a public asset host", () => {
    vi.stubEnv("EMAIL_ASSET_ORIGIN", "");
    expect(emailAssetOrigin()).toBe(DEFAULT_EMAIL_ASSET_ORIGIN);
    vi.stubEnv("EMAIL_ASSET_ORIGIN", "https://assets.example.com/");
    expect(emailAssetOrigin()).toBe("https://assets.example.com");
  });
  it.each(["http://localhost:3022", "https://localhost", "https://127.0.0.1", "https://10.0.0.1", "https://[::1]", "https://mail.local", "https://dev.localhost", "https://user:pass@example.com", "https://example.com/path", "https://example.com?query=1"])("rejects unusable asset origin %s", value => {
    vi.stubEnv("EMAIL_ASSET_ORIGIN", value);
    expect(() => emailAssetOrigin()).toThrow();
  });
  it("renders all seven templates with public images and fonts while keeping local application links", async () => {
    vi.stubEnv("EMAIL_ASSET_ORIGIN", "https://assets.example.com");
    const id = "264b791e-b806-4b52-b79e-5229b7224df0", origin = "http://localhost:3022";
    const draft = initialDraft("evaluation"), formal = {id, locale:"en", data:initialData()};
    const app = {id, locale:"en", first_name:"TEST", last_name:"Applicant", payment_status:"paid", status:"completed", result:{result:"Test result", reasoning:"Test explanation"}};
    const mails = await Promise.all([
      confirmationEmail(id,"en",draft,intakeQuote(draft),origin),
      paymentConfirmationEmail(formal,{id:"test-payment",amount_cents:11000,status:"paid",paid_at:"2026-10-20T18:00:00Z"},origin),
      feeUpdateEmail(formal,{total:11000,explanation:"Test quote"},origin),
      ...(["confirmation","result","information","access"] as const).map(kind => customerEmail(app,undefined,kind,origin,"Test request")),
    ]);
    for (const mail of mails) {
      expect([...mail.html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(match=>match[1])).toEqual(["https://assets.example.com/brand/aet-logo-header.png"]);
      expect(mail.html).toContain("https://assets.example.com/fonts/poppins-400-latin.woff2");
      expect(mail.html).not.toContain("http://localhost:3022/brand/");
      expect(mail.html).not.toContain("http://localhost:3022/fonts/");
      expect(mail.html).toContain(origin);
    }
  });
});
