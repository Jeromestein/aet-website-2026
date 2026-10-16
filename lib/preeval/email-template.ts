import { BASE_CENTS, FEE_CENTS, TOTAL_CENTS, resultPath } from "./domain";
import { countryLabel } from "../legacy-application/countries";

export const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g,
  char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
export type CustomerEmailKind = "confirmation" | "result" | "access" | "information";
type Application = { id: string; locale: string; first_name: string; middle_name?: string; last_name: string;
  payment_status: string; status: string; result?: { result: string; reasoning: string } | null };
type Education = { school_name: string; degree_obtained: string; country_of_study: string; start_date: string; end_date: string };

export function customerEmail(app: Application, education: Education | undefined, kind: CustomerEmailKind, origin: string, message = "") {
  const title = {
    confirmation: "AET Degree Equivalency Application Confirmation",
    result: "AET Degree Equivalency Results",
    access: "AET Application Status",
    information: "AET Degree Equivalency — Additional Information",
  }[kind];
  const intro = {
    confirmation: "Thank you for submitting your degree equivalency application. Your application is saved.",
    result: "Your preliminary degree equivalency result is ready.",
    access: "Use your Application ID or the link below to check your application.",
    information: "Please review the following request for additional information.",
  }[kind];
  const rows = education ? [["Institution", education.school_name], ["Degree", education.degree_obtained],
    ["Country of study", countryLabel(education.country_of_study, "en")], ["Study period", `${education.start_date} – ${education.end_date}`]] : [];
  const amount = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const visibleResult = kind === "result" && app.payment_status === "paid" && !["cancelled", "needs_information"].includes(app.status) ? app.result : null;
  const link = origin.replace(/\/$/, "") + resultPath(app.locale, app.id);
  const details = rows.map(([label, value]) => `<tr><th style="padding:10px;text-align:left;color:#5B6D7E;font-weight:400">${escapeHtml(label)}</th><td style="padding:10px">${escapeHtml(value)}</td></tr>`).join("");
  const html = `<html><body style="margin:0;background:#F8FBFE;color:#18334E;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;padding:32px 20px"><p style="font-weight:700;letter-spacing:2px;color:#507FA6">AET · PRE-EVALUATION</p><h1 style="font-size:28px;line-height:1.25">${title}</h1><p>Dear ${escapeHtml([app.first_name, app.middle_name, app.last_name].filter(Boolean).join(" "))},</p><p>${intro}</p><div style="background:#EAF4FC;padding:20px;border-radius:16px"><strong>Application ID</strong><p style="word-break:break-all;margin-bottom:0">${escapeHtml(app.id)}</p></div>${details ? `<h2 style="font-size:20px">Your education</h2><table style="width:100%;border-collapse:collapse">${details}</table>` : ""}${message ? `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` : ""}${kind === "confirmation" ? `<p>Pre-evaluation: ${amount(BASE_CENTS)}<br>Payment processing fee: ${amount(FEE_CENTS)}<br><strong>Total: ${amount(TOTAL_CENTS)} USD</strong></p><p>Complete payment to view your preliminary result. You can add supporting documents on your application page.</p>` : ""}${visibleResult ? `<div style="background:#EAF4FC;padding:20px;border-radius:16px"><h2 style="font-size:20px">U.S. degree equivalency</h2><p style="font-size:22px;font-weight:700">${escapeHtml(visibleResult.result)}</p><h3>Assessment basis</h3><p>${escapeHtml(visibleResult.reasoning).replace(/\n/g, "<br>")}</p></div>` : ""}<p style="margin:28px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#C7471D;color:white;padding:15px 24px;border-radius:12px;text-decoration:none;font-weight:700">View your application</a></p><p>Keep this email. You can reopen this link whenever you need to check your application, or enter your Application ID on the status page. No customer account is required.</p><p style="font-size:13px;line-height:1.7;color:#5B6D7E">Any degree equivalency shown is based on the information you provided. It is not derived from verified documents and cannot be used as proof of attendance or degree completion. AET may update this provisional result after document verification and analysis.</p><hr style="border:0;border-top:1px solid #D9E5EF"><p style="font-size:12px">American Education and Translation Services, CORP (AET)</p></div></body></html>`;
  return { subject: title, html };
}
