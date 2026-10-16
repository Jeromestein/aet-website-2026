import { describe, it, expect } from "vitest";
import { customerLookupSchema } from "../lib/preeval/customer-access";
import { customerEmail } from "../lib/preeval/email-template";

const id = "264b791e-b806-4b52-b79e-5229b7224df0";
const app = { id, locale: "zh", first_name: "QA <Applicant>", last_name: "Test", payment_status: "unpaid", status: "submitted", result: { result: "PRIVATE RESULT", reasoning: "PRIVATE REASONING" } };
const education = { school_name: "University <script>alert(1)</script>", degree_obtained: "Test degree", country_of_study: "CN", start_date: "2018-09", end_date: "2022-06" };
describe("Application-ID lookup without customer accounts", () => {
  it("accepts a complete UUID with pasted whitespace and uppercase", () => {
    expect(customerLookupSchema.parse({ applicationId: ` ${id.toUpperCase()} `, locale: "zh" }).applicationId).toBe(id);
  });
  it.each(["", "123", "someone@example.org", "../../admin", "264b791e"]) ("rejects incomplete or unrelated identifiers: %s", applicationId => {
    expect(customerLookupSchema.safeParse({ applicationId }).success).toBe(false);
  });
  it("rejects privilege or URL injection", () => {
    expect(customerLookupSchema.safeParse({ applicationId: id, role: "admin" }).success).toBe(false);
    expect(customerLookupSchema.safeParse({ applicationId: id, locale: "https://example.org" }).success).toBe(false);
  });
});
describe("Legacy-style confirmation and result emails", () => {
  it("includes the ID, education, exact price and reusable localized link", () => {
    const { html } = customerEmail(app, education, "confirmation", "http://localhost:3022");
    for (const value of [id, "Test degree", "$19.00", "$0.88", "$19.88", `/zh/degree-equivalency-tool/application/success?applicationId=${id}`]) expect(html).toContain(value);
    expect(html).not.toContain("24 hours"); expect(html).not.toContain("#token="); expect(html).not.toContain("PRIVATE RESULT");
  });
  it("escapes applicant, education, result and information text", () => {
    const { html } = customerEmail(app, education, "information", "http://localhost:3022", '<img src=x onerror="bad()">');
    expect(html).not.toContain("<script>"); expect(html).not.toContain("<img"); expect(html).toContain("&lt;Applicant&gt;");
  });
  it.each(["unpaid", "pending", "refunded", "partially_refunded"])("does not include a result when payment is %s", payment_status => {
    expect(customerEmail({ ...app, payment_status }, education, "result", "http://localhost:3022").html).not.toContain("PRIVATE RESULT");
  });
  it.each(["cancelled", "needs_information"])("does not include withheld result for %s", status => {
    expect(customerEmail({ ...app, payment_status: "paid", status }, education, "result", "http://localhost:3022").html).not.toContain("PRIVATE RESULT");
  });
  it("includes result and reasoning in the paid result email", () => {
    const { html } = customerEmail({ ...app, payment_status: "paid", status: "completed" }, education, "result", "http://localhost:3022");
    expect(html).toContain("PRIVATE RESULT"); expect(html).toContain("PRIVATE REASONING");
  });
});
