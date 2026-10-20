import { Text, render } from "react-email";
import { BrandedEmailLayout } from "../email/branded-layout";
import { EmailAmount, EmailContent, EmailDetail, EmailDivider, EmailHeading, EmailHero, EmailPanel, EmailReference, EmailSignoff, label, money, paragraph, privateIdNote } from "../email/parts";
import { BASE_CENTS, FEE_CENTS, TOTAL_CENTS, resultPath } from "./domain";
import { countryLabel } from "../legacy-application/countries";

export type CustomerEmailKind = "confirmation" | "result" | "access" | "information";
export type EmailApplication = {
  id: string; locale: string; first_name: string; middle_name?: string; last_name: string;
  payment_status: string; status: string; result?: { result: string; reasoning: string } | null;
};
export type EmailEducation = {
  school_name: string; degree_obtained: string; country_of_study: string; start_date: string; end_date: string;
};
const subjects: Record<CustomerEmailKind, string> = {
  confirmation: "AET Degree Equivalency Application Confirmation",
  result: "AET Degree Equivalency Results",
  access: "AET Application Status",
  information: "AET Degree Equivalency — Additional Information",
};
const headlines: Record<CustomerEmailKind, string> = {
  confirmation: "Application Received", result: "Preliminary Result Ready",
  access: "Your Application", information: "Information Needed",
};
const intros: Record<CustomerEmailKind, string> = {
  confirmation: "Thank you for submitting your degree equivalency application. We’ve saved your information. Here’s a summary and what to do next.",
  result: "Your preliminary degree equivalency assessment is ready. You’ll find the result and its assessment basis below.",
  access: "Here’s your application link again. Use it whenever you need to review your information or check your progress.",
  information: "We need a little more information to continue reviewing your application. Please review the request below.",
};
export type EmailPreviewOptions = { assetOrigin?: string; notice?: string };
type Props = { app: EmailApplication; education?: EmailEducation; kind: CustomerEmailKind; origin: string; message?: string } & EmailPreviewOptions;
export function PreEvaluationEmail({ app, education, kind, origin, message = "", assetOrigin, notice }: Props) {
  const result = kind === "result" && app.payment_status === "paid" && !["cancelled", "needs_information"].includes(app.status) ? app.result : null;
  const statusUrl = origin.replace(/\/$/, "") + resultPath(app.locale, app.id);
  const rows = education ? [
    ["Institution", education.school_name], ["Degree", education.degree_obtained],
    ["Country", countryLabel(education.country_of_study, "en")],
    ["Study period", `${education.start_date} – ${education.end_date}`],
  ] : [];
  const headline = kind === "result" && !result ? "Your Application Status" : headlines[kind];
  const description = kind === "result" ? (result ? "Your preliminary assessment is ready. Review your result and the details below." : "Check your application for the latest update.")
    : kind === "information" ? "A few more details will help us continue your review. See what’s needed below."
    : kind === "confirmation" ? "Your education details are saved. Continue your application to take the next step."
    : "Your details and progress, together in one place. Use the link below to return to your application.";
  const actionLabel = kind === "information" ? "Review Request & Upload" : kind === "confirmation" ? "Continue Your Application" : "View Your Application";
  return (
    <BrandedEmailLayout origin={origin} assetOrigin={assetOrigin} statusUrl={statusUrl} preview={headline} notice={notice}>
      <EmailHero eyebrow={kind === "access" ? "YOUR AET APPLICATION" : "DEGREE EQUIVALENCY"} description={description} action={{ href: statusUrl, label: actionLabel }} note={privateIdNote}>{headline}</EmailHero>
      <EmailContent>
        <Text style={{ ...paragraph, color: "#18334E", marginBottom: "8px" }}>Dear {[app.first_name, app.middle_name, app.last_name].filter(Boolean).join(" ")},</Text>
        <Text style={paragraph}>{kind === "result" && !result ? "Open your application for the latest status. A preliminary result is not currently available." : intros[kind]}</Text>
        <EmailReference id={app.id} />
        {kind === "information" && <EmailPanel><Text style={label}>INFORMATION REQUESTED</Text><Text style={{ ...paragraph, margin: 0, color: "#18334E", whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{message}</Text></EmailPanel>}
        {result && <><EmailPanel><Text style={label}>PRELIMINARY U.S. EQUIVALENCY</Text><Text style={{ margin: 0, fontSize: "25px", lineHeight: "33px", fontWeight: 600, color: "#18334E", overflowWrap: "anywhere" }}>{result.result}</Text></EmailPanel><EmailHeading>Assessment Basis</EmailHeading><Text style={{ ...paragraph, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{result.reasoning}</Text><EmailDivider /></>}
        {rows.length > 0 && <><EmailHeading>Your Education</EmailHeading>{rows.map(([title, value]) => <EmailDetail key={title} title={title}>{value}</EmailDetail>)}</>}
        {kind === "confirmation" && <>
          <EmailAmount title="PRE-EVALUATION TOTAL" cents={TOTAL_CENTS}><Text style={{ margin: 0, color: "#5B6D7E", fontSize: "12px", lineHeight: "20px" }}>Pre-evaluation {money(BASE_CENTS)} · Processing fee {money(FEE_CENTS)}</Text></EmailAmount>
          <EmailHeading>What Happens Next?</EmailHeading><Text style={paragraph}>Complete payment on your application page to view your preliminary result. You can also add supporting documents there.</Text>
        </>}
        {kind === "information" && <><EmailDivider /><EmailHeading>How to Respond</EmailHeading><Text style={paragraph}>Open your application and add the requested documents. If you need help with the request, contact our team using the link below.</Text></>}

        {kind === "access" && <Text style={paragraph}>You can also enter your Application ID on the status page. No customer account or password is required.</Text>}
        {kind !== "access" && <><EmailDivider /><Text style={{ margin: 0, fontSize: "12px", lineHeight: "20px", color: "#5B6D7E" }}>Any degree equivalency shown is based on the information you provided. It is not derived from verified documents and cannot be used as proof of attendance or degree completion. AET may update this provisional result after document verification and analysis.</Text></>}
        <EmailSignoff />
      </EmailContent>
    </BrandedEmailLayout>
  );
}
export async function customerEmail(app: EmailApplication, education: EmailEducation | undefined, kind: CustomerEmailKind, origin: string, message = "", options: EmailPreviewOptions = {}) {
  return { subject: subjects[kind], html: await render(<PreEvaluationEmail app={app} education={education} kind={kind} origin={origin} message={message} {...options} />) };
}
