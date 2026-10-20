import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { officeCc } from "../lib/email/office-routing";
import { deliveryHash } from "../lib/email/delivery";

describe("office email routing", () => {
  it.each([
    ["Miami", "miami", ["info@americantranslationservice.com"]],
    ["Los Angeles", "la", ["ca2@aet21.com"]],
    ["San Francisco", "sf", ["ca@aet21.com"]],
    ["Boston", "boston", ["boston@aet21.com", "boston@americantranslationservice.com"]],
    ["New York", "nyc", ["nyc@aet21.com", "nyc@americantranslationservice.com"]],
  ])("routes %s in legacy and current applications", (name, id, addresses) => {
    expect(officeCc(name as string, "test@example.invalid")).toEqual(addresses);
    expect(officeCc(id as string, "test@example.invalid")).toEqual(addresses);
  });
  it("does not duplicate a customer who is already the office recipient", () => {
    expect(officeCc("miami", " INFO@AMERICANTRANSLATIONSERVICE.COM ")).toEqual([]);
  });
  it("blocks missing or unknown offices instead of copying a different office", () => {
    for (const office of ["", "unknown"]) expect(() => officeCc(office, "test@example.invalid")).toThrow("office_email_unavailable");
  });
  const mail = { id: "test", from: "AET <info@americantranslationservice.com>", recipient: "test@example.invalid", subject: "TEST", html: "<p>TEST</p>" };
  it("blocks retries whose CC recipients changed", () => {
    const cc = officeCc("miami", mail.recipient);
    const digest = deliveryHash({ ...mail, cc });
    expect(deliveryHash({ ...mail, cc: [...cc] }, digest)).toBe(digest);
    expect(() => deliveryHash({ ...mail, cc: officeCc("la", mail.recipient) }, digest)).toThrow("email_content_changed");
    expect(() => deliveryHash(mail, digest)).toThrow("email_content_changed");
  });
  it("preserves old hashes for messages with no CC", () => {
    const old = createHash("sha256").update(JSON.stringify([mail.from, mail.recipient, mail.subject, mail.html])).digest("hex");
    expect(deliveryHash(mail, old)).toBe(old);
    expect(deliveryHash({ ...mail, cc: [] }, old)).toBe(old);
    expect(() => deliveryHash({ ...mail, cc: officeCc("miami", mail.recipient) }, old)).toThrow("email_content_changed");
  });
});
