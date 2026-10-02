import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  applicationSchema,
  BASE_CENTS,
  TOTAL_CENTS,
  FEE_CENTS,
  canRelease,
  validFile,
} from "../lib/preeval/domain";
const valid = {
  requestId: randomUUID(),
  locale: "en",
  email: "tech@meiyugroup.org",
  firstName: "Test",
  lastName: "Applicant",
  country: "China",
  schoolName: "Test University",
  countryOfStudy: "China",
  degreeObtained: "Bachelor of Engineering",
  startDate: "2018-09",
  endDate: "2022-06",
  terms: true,
};
describe("Pre-evaluation business and access rules", () => {
  it("preserves the legacy gross-up and exact cents", () => {
    expect(BASE_CENTS).toBe(1900);
    expect(TOTAL_CENTS).toBe(1988);
    expect(FEE_CENTS).toBe(88);
  });
  it.each([
    "firstName",
    "lastName",
    "country",
    "email",
    "schoolName",
    "countryOfStudy",
    "degreeObtained",
    "startDate",
    "endDate",
  ])("requires legacy field %s", (key) => {
    expect(applicationSchema.safeParse({ ...valid, [key]: "" }).success).toBe(
      false,
    );
  });
  it("does not require a middle name or an attachment", () => {
    expect(applicationSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects reversed dates and untrusted payment/office/result input", () => {
    for (const value of [
      { ...valid, endDate: "2010-01" },
      { ...valid, amount: 1 },
      { ...valid, result: "paid" },
      { ...valid, office: "Miami" },
    ])
      expect(applicationSchema.safeParse(value).success).toBe(false);
  });
  it.each(["unpaid", "pending", "refunded", "partially_refunded"])(
    "never releases results when payment is %s",
    (payment) => {
      expect(canRelease(payment, "completed")).toBe(false);
    },
  );
  it("does not release a cancelled application", () => {
    expect(canRelease("paid", "cancelled")).toBe(false);
    expect(canRelease("paid", "completed")).toBe(true);
  });
  it("validates file signatures rather than trusting the extension or MIME alone", () => {
    expect(
      validFile(Buffer.from("<script>bad</script>"), "application/pdf"),
    ).toBe(false);
    expect(validFile(Buffer.from("%PDF-1.7 test"), "application/pdf")).toBe(
      true,
    );
    expect(validFile(Buffer.alloc(0), "image/png")).toBe(false);
  });
});
