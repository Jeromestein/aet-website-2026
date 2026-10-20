import { Button, Column, Heading, Hr, Row, Section, Text, render } from "react-email";
import type { CSSProperties, ReactNode } from "react";
import { BrandedEmailLayout, mailColors as colors } from "../email/branded-layout";
import { countryLabel } from "../legacy-application/countries";
import { officeNames, statusPath, type IntakeReceipt } from "./intake";

type Props = Pick<IntakeReceipt, "id" | "data" | "quote"> & { locale: string; origin: string; assetOrigin?: string };
const paragraph: CSSProperties = { margin: "0 0 16px", fontSize: "15px", lineHeight: "25px", color: colors.muted };
const label: CSSProperties = { margin: "0 0 10px", fontSize: "11px", lineHeight: "16px", letterSpacing: "1.6px", fontWeight: 600, color: colors.muted };
function Detail({ title, children }: { title: string; children: ReactNode }) {
  return <Row><Column className="email-detail-label" style={{ width: "116px", verticalAlign: "top", padding: "7px 12px 7px 0", color: colors.muted, fontSize: "13px", lineHeight: "21px" }}>{title}</Column><Column style={{ padding: "7px 0", fontSize: "14px", lineHeight: "21px", color: colors.ink, verticalAlign: "top", overflowWrap: "anywhere" }}>{children}</Column></Row>;
}
function NextStep({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <Row style={{ marginBottom: "15px" }}><Column style={{ width: "34px", verticalAlign: "top", fontSize: "12px", lineHeight: "22px", fontWeight: 600, color: "#507FA6" }}>{number}</Column><Column><Text style={{ margin: "0 0 3px", fontSize: "14px", lineHeight: "22px", fontWeight: 600 }}>{title}</Text><Text style={{ ...paragraph, margin: 0, fontSize: "13px", lineHeight: "21px" }}>{children}</Text></Column></Row>;
}

export function IntakeConfirmationEmail({ id, locale, data, quote, origin, assetOrigin }: Props) {
  const statusUrl = origin.replace(/\/$/, "") + statusPath(id, locale);
  const selected = [
    data.evaluationRequest.services.document.selected && "Document by Document Evaluation",
    data.evaluationRequest.services.course.selected && "Course by Course Evaluation",
  ].filter(Boolean) as string[];
  const amount = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  return (
    <BrandedEmailLayout notice="Preview only · No payment has been collected. No document upload or payment is requested in this test. Application links are for the local test website." origin={origin} assetOrigin={assetOrigin} statusUrl={statusUrl} preview="Your AET application has been received. Review your application summary and next steps.">
      <Section className="email-gutter" style={{ backgroundColor: colors.blue, padding: "28px 36px 30px" }}>
        <Text style={{ ...label, color: "#507FA6", marginBottom: "14px" }}>CREDENTIAL EVALUATION</Text>
        <Heading className="email-heading" style={{ margin: 0, fontSize: "36px", lineHeight: "41px", letterSpacing: "-1.2px", fontWeight: 600, color: colors.ink }}>We’ve Received<br />Your Application.</Heading>
      </Section>
      <Section className="email-gutter" style={{ padding: "28px 36px 30px" }}>
        <Text style={{ ...paragraph, color: colors.ink, marginBottom: "8px" }}>Dear {data.contactName},</Text>
        <Text style={paragraph}>Thank you for choosing AET. Your application has been saved successfully. Here’s a summary for your records.</Text>
        <Section style={{ margin: "24px 0 18px", paddingBottom: "16px", borderBottom: `1px solid ${colors.line}` }}>
          <Text style={{ ...label, marginBottom: "6px" }}>APPLICATION ID</Text>
          <Text style={{ margin: 0, fontSize: "12px", lineHeight: "19px", fontFamily: "Consolas, Monaco, monospace", color: colors.muted, wordBreak: "break-all" }}>{id}</Text>
        </Section>
        <Heading as="h2" style={{ margin: "0 0 12px", fontSize: "20px", lineHeight: "27px", fontWeight: 600, letterSpacing: "-0.4px" }}>Your Application at a Glance</Heading>
        <Detail title="Applicant">{[data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ")}</Detail>
        <Detail title="Service">{selected.map((service, index) => <span key={service}>{index > 0 && <br />}{service}</span>)}</Detail>
        <Detail title="Report">{data.evaluationDelivery.report === "pdf" ? "Digital report (PDF)" : "Paper report"}</Detail>
        {data.office && <Detail title="Office">{officeNames[data.office] || data.office}</Detail>}
        {data.evaluationRequest.translation && <Detail title="Translation">Requested · Quote pending</Detail>}
        <Hr style={{ borderColor: colors.line, margin: "18px 0" }} />
        <Text style={label}>{data.educations.length === 1 ? "EDUCATION" : "EDUCATION RECORDS"}</Text>
        {data.educations.map((education, index) => <Section key={index} style={{ marginBottom: index < data.educations.length - 1 ? "12px" : 0 }}>
          <Text style={{ margin: "0 0 3px", fontSize: "14px", lineHeight: "22px", fontWeight: 600 }}>{education.degree}</Text>
          <Text style={{ margin: 0, fontSize: "13px", lineHeight: "21px", color: colors.muted }}>{education.school} · {countryLabel(education.country, "en")}</Text>
        </Section>)}
        <Section style={{ marginTop: "22px", padding: "20px 22px", backgroundColor: colors.blue, borderRadius: "10px" }}>
          <Text style={{ ...label, marginBottom: "7px", letterSpacing: "1px" }}>ESTIMATED SERVICE FEES</Text>
          <Text style={{ margin: "0 0 7px", fontSize: "28px", lineHeight: "34px", fontWeight: 600, letterSpacing: "-0.7px" }}>{amount(quote.min)}{quote.max !== quote.min ? " – " + amount(quote.max) : ""}<span style={{ fontSize: "12px", fontWeight: 400, letterSpacing: 0, paddingLeft: "6px" }}> USD</span></Text>
          <Text style={{ margin: 0, color: colors.muted, fontSize: "12px", lineHeight: "19px" }}>{quote.needsQuote && <>Final quote pending.<br /></>}Payment processing fees are not included.</Text>
        </Section>
        <Section style={{ margin: "24px 0 26px" }}>
          <Button href={statusUrl} style={{ backgroundColor: colors.orange, color: "#FFFFFF", padding: "16px 24px", borderRadius: "8px", fontSize: "14px", lineHeight: "18px", fontWeight: 600, textDecoration: "none" }}>View Application Status</Button>
          <Text style={{ margin: "12px 0 0", fontSize: "12px", lineHeight: "19px", color: colors.muted }}>Keep your Application ID private. It opens your application without an account.</Text>
        </Section>
        <Hr style={{ borderColor: colors.line, margin: "0 0 24px" }} />
        <Heading as="h2" style={{ margin: "0 0 18px", fontSize: "20px", lineHeight: "27px", fontWeight: 600, letterSpacing: "-0.4px" }}>What Happens Next?</Heading>
        <NextStep number="01" title="Review Your Details">Open your application to check the information and services you selected.</NextStep>
        <NextStep number="02" title="Documents & Payment">For the full service, processing begins once all required documents and payment have been received.</NextStep>
        <Text style={{ margin: "22px 0 0", fontSize: "14px", lineHeight: "22px", color: colors.muted }}>Best regards,<br /><strong style={{ color: colors.ink }}>The AET Team</strong></Text>
      </Section>
    </BrandedEmailLayout>
  );
}

export async function confirmationEmail(id: string, locale: string, data: Props["data"], quote: Props["quote"], origin: string, assetOrigin?: string) {
  return {
    subject: `[AET TEST] Application received — ${id}`,
    html: await render(<IntakeConfirmationEmail id={id} locale={locale} data={data} quote={quote} origin={origin} assetOrigin={assetOrigin} />),
  };
}
