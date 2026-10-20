import { EmailReviewRequired } from "./delivery";

// Preserve the legacy application's office routing, including Miami's single mailbox.
const officeRecipients: Record<string, readonly string[]> = {
  miami: ["info@americantranslationservice.com"],
  la: ["ca2@aet21.com"],
  sf: ["ca@aet21.com"],
  boston: ["boston@aet21.com", "boston@americantranslationservice.com"],
  nyc: ["nyc@aet21.com", "nyc@americantranslationservice.com"],
};
const aliases: Record<string, string> = {
  "los angeles": "la", "san francisco": "sf", "new york": "nyc",
};

/** Resolve from saved application data; never guess an office for unknown values. */
export function officeCc(office: string, recipient: string): string[] {
  const key = office.trim().toLowerCase();
  const addresses = officeRecipients[aliases[key] ?? key];
  if (!addresses) throw new EmailReviewRequired("office_email_unavailable");
  return addresses.filter(address => address !== recipient.trim().toLowerCase());
}
