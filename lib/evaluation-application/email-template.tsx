import { Text, render } from "react-email";
import { BrandedEmailLayout } from "../email/branded-layout";
import { EmailAmount, EmailContent, EmailDetail, EmailDivider, EmailHeading, EmailHero, EmailPanel, EmailReference, EmailSignoff, label, paragraph } from "../email/parts";
import type { ApplicationData } from "./domain";
import { receiptPath } from "./workflow";
import type { EmailPreviewOptions } from "../preeval/email-template";

export type FormalEmailApplication = { id: string; locale: string; data: ApplicationData };
export type PaymentReceipt = { id: string; amount_cents: number; paid_at: Date | string; status: string; estimated_completion?: string | null };
export type FeeUpdate = { total: number | null; explanation: string };
const services: Record<string, string> = {
  document: "Document by Document Evaluation", course: "Course by Course Evaluation",
  expert: "Expert Opinion Letter", position: "Position Evaluation",
};
function ServiceSummary({ app }: { app: FormalEmailApplication }) {
  const names = Object.entries(services).filter(([key]) => app.data.services[key as "document" | "course" | "expert" | "position"].tier).map(([, name]) => name);
  if (app.data.services.translation) names.push("Translation");
  if (app.data.services.customized) names.push("Customized service");
  return <><EmailHeading>Application Summary</EmailHeading><EmailDetail title="Applicant">{[app.data.evaluee.first, app.data.evaluee.middle, app.data.evaluee.last].filter(Boolean).join(" ") || app.data.client.name}</EmailDetail><EmailDetail title="Services">{names.map((name, i) => <span key={name}>{i > 0 && <br />}{name}</span>)}</EmailDetail><EmailDetail title="Report">{app.data.delivery.report === "pdf" ? "Digital report (PDF)" : "Paper report"}</EmailDetail></>;
}
function paymentDate(value: string | Date) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Missing confirmed payment date");
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(date);
}
type SharedProps = { app: FormalEmailApplication; origin: string } & EmailPreviewOptions;
export function PaymentConfirmationEmail({ app, payment, origin, assetOrigin, notice }: SharedProps & { payment: PaymentReceipt }) {
  if (payment.status !== "paid" || !Number.isSafeInteger(payment.amount_cents) || payment.amount_cents <= 0 || !payment.paid_at) throw new Error("A confirmed payment record is required");
  const statusUrl = origin.replace(/\/$/, "") + receiptPath(app.locale, app.id);
  return <BrandedEmailLayout origin={origin} assetOrigin={assetOrigin} statusUrl={statusUrl} preview="Your payment has been received. Here are your payment details and next steps." notice={notice}>
    <EmailHero eyebrow="PAYMENT CONFIRMATION" description="Your payment is recorded. View your receipt and follow the next steps for your application." action={{ href: statusUrl, label: "View Application Status" }}>Payment<br />Received</EmailHero>
    <EmailContent>
      <Text style={{ ...paragraph, color: "#18334E", marginBottom: "8px" }}>Dear {app.data.client.name},</Text>
      <Text style={paragraph}>Thank you for your payment. We’ve recorded it against your AET application. Please keep this email for your records.</Text>
      <EmailReference id={app.id} />
      <EmailAmount title="AMOUNT RECEIVED" cents={payment.amount_cents}><Text style={{ margin: 0, fontSize: "12px", lineHeight: "20px", color: "#5B6D7E" }}>Payment confirmed</Text></EmailAmount>
      <EmailDetail title="Confirmed on">{paymentDate(payment.paid_at)}</EmailDetail>
      <EmailDetail title="Payment ID"><span style={{ fontFamily: "Consolas, Monaco, monospace", fontSize: "12px", wordBreak: "break-all" }}>{payment.id}</span></EmailDetail>
      {payment.estimated_completion && <EmailDetail title="Estimated completion">{payment.estimated_completion}</EmailDetail>}
      <EmailDivider /><ServiceSummary app={app} />
      <EmailDivider />
      <EmailHeading>What Happens Next?</EmailHeading><Text style={paragraph}>Processing begins once your payment and all required documents have been received. Open your application to review its status and any outstanding document requests.</Text>
      {payment.estimated_completion && <Text style={{ ...paragraph, fontSize: "13px" }}>The estimated completion date may change if required materials are missing or a federal holiday affects processing.</Text>}
      <EmailSignoff />
    </EmailContent>
  </BrandedEmailLayout>;
}
export function FeeUpdateEmail({ app, fee, origin, assetOrigin, notice }: SharedProps & { fee: FeeUpdate }) {
  if (fee.total !== null && (!Number.isSafeInteger(fee.total) || fee.total < 0)) throw new Error("Invalid fee amount");
  const statusUrl = origin.replace(/\/$/, "") + receiptPath(app.locale, app.id);
  return <BrandedEmailLayout origin={origin} assetOrigin={assetOrigin} statusUrl={statusUrl} preview="The service fee for your AET application has been updated. Review the details here." notice={notice}>
    <EmailHero eyebrow="SERVICE FEE UPDATE" description={fee.total === null ? "We’re reviewing your quote. You can check the latest details below." : "Your service fee has been updated. Review the amount and details before making payment."} action={{ href: statusUrl, label: fee.total === null ? "View Your Application" : "Review Fee & Payment Options" }}>Service Fee<br />{fee.total === null ? "In Review" : "Updated"}</EmailHero>
    <EmailContent>
      <Text style={{ ...paragraph, color: "#18334E", marginBottom: "8px" }}>Dear {app.data.client.name},</Text>
      <Text style={paragraph}>{fee.total === null ? "We’re reviewing the service fee for your AET application. Here’s the latest update and a summary of your selected services." : "The service fee for your AET application has been updated. You’ll find the current amount and service details below."}</Text>
      <EmailReference id={app.id} />
      {fee.total === null ? <EmailPanel><Text style={label}>QUOTE IN REVIEW</Text><Text style={{ ...paragraph, margin: 0 }}>Your final service fee is still being reviewed. No payment is requested until the quote has been confirmed.</Text></EmailPanel> : <EmailAmount title="UPDATED SERVICE FEE" cents={fee.total}><Text style={{ margin: 0, fontSize: "12px", lineHeight: "20px", color: "#5B6D7E" }}>Review the current amount on your application before paying.</Text></EmailAmount>}
      {fee.explanation && <><EmailHeading>About This Update</EmailHeading><Text style={{ ...paragraph, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{fee.explanation}</Text></>}
      <EmailDivider /><ServiceSummary app={app} />
      <EmailDivider />
      <Text style={paragraph}>If you have questions about this update or the selected services, contact our team before making payment.</Text>
      <EmailSignoff />
    </EmailContent>
  </BrandedEmailLayout>;
}
export async function paymentConfirmationEmail(app: FormalEmailApplication, payment: PaymentReceipt, origin: string, options: EmailPreviewOptions = {}) {
  return { subject: "AET Services Payment Confirmation", html: await render(<PaymentConfirmationEmail app={app} payment={payment} origin={origin} {...options} />) };
}
export async function feeUpdateEmail(app: FormalEmailApplication, fee: FeeUpdate, origin: string, options: EmailPreviewOptions = {}) {
  return { subject: "AET Services Service Fee Update", html: await render(<FeeUpdateEmail app={app} fee={fee} origin={origin} {...options} />) };
}
