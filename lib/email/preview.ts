import "server-only";
import { confirmationEmail } from "@/lib/application/intake-template";
import { initialDraft } from "@/lib/application/model";
import { selectEvaluationService } from "@/lib/application/evaluation";
import { intakeQuote } from "@/lib/application/intake";
import { feeUpdateEmail, paymentConfirmationEmail, workflowNotificationEmail } from "@/lib/evaluation-application/email-template";
import { initialData } from "@/lib/evaluation-application/domain";
import { customerEmail } from "@/lib/preeval/email-template";

export const emailPreviewTemplates = [
  { id: 'intake', title: 'Formal application confirmation', category: 'Credential evaluation', description: 'Application received, selected services and estimated fees.' },
  { id: 'payment', title: 'Payment confirmation', category: 'Credential evaluation', description: 'Confirmed payment amount, receipt reference and next steps.' },
  { id: 'fee_update', title: 'Service fee update', category: 'Credential evaluation', description: 'A confirmed service quote or a quote still under review.' },
  { id: 'confirmation', title: 'Pre-evaluation confirmation', category: 'Pre-evaluation', description: 'Application summary and instructions for getting started.' },
  { id: 'result', title: 'Pre-evaluation result', category: 'Pre-evaluation', description: 'A paid preliminary assessment, reasoning and qualifications.' },
  { id: 'information', title: 'Additional information request', category: 'Both services', description: 'The specific materials requested by the reviewing team.' },
  { id: 'access', title: 'Application lookup link', category: 'Pre-evaluation', description: 'A replacement link for checking application progress.' },
  { id: 'report', title: 'Evaluation report ready', category: 'Credential evaluation', description: 'Notification that the final PDF is available to download.' },
] as const;
export type EmailPreviewKind = typeof emailPreviewTemplates[number]['id'];

export async function sampleEmail(kind: EmailPreviewKind, assetOrigin: string, pendingFee = false, formalInformation = false) {
  const id = "264b791e-b806-4b52-b79e-5229b7224df0";
  const origin = "https://preview.example.invalid";
  const education = {
    school_name: "Example University", country_of_study: "GB", degree_obtained: "Bachelor of Science",
    start_date: "2018-09", end_date: "2022-06",
  };
  if (kind === "intake") {
    const data = {
      ...initialDraft("evaluation"), contactName: "Sample Applicant", email: "sample@example.invalid",
      phone: "+1 555 0100", office: "miami", pronouns: "mx", firstName: "Sample", lastName: "Applicant", purpose: "other",
      educations: [{ school: education.school_name, country: "GB", degree: education.degree_obtained, start: "2018-09", end: "2022-06" }],
    };
    data.evaluationRequest = selectEvaluationService(data.evaluationRequest, "document", 1);
    return confirmationEmail(id, "en", data, intakeQuote(data), origin, assetOrigin);
  }
  const options = { assetOrigin, notice: "Preview only · Fictional application data. No email is sent and no live payment is processed." };
  if (kind === "payment" || kind === "fee_update" || kind === "report" || (kind === "information" && formalInformation)) {
    const data = initialData();
    data.client.name = "Sample Applicant";
    data.evaluee.first = "Sample";
    data.evaluee.last = "Applicant";
    data.services.document.tier = "standard";
    data.services.translation = true;
    const formal = { id, locale: "en", data: { ...data, intakeVersion: 2 } };
    if (kind === "report" || kind === "information") return workflowNotificationEmail(formal, kind, "Please upload a clear copy of your final academic transcript, including all pages. This is a fictional request for preview only.", origin, options);
    return kind === "payment"
      ? paymentConfirmationEmail(formal, { id: "859e5e7c-2291-433e-9d9e-26a6e26577fd", amount_cents: 16000, paid_at: "2026-10-20T15:30:00Z", status: "paid" }, origin, options)
      : feeUpdateEmail(formal, { total: pendingFee ? null : 16000, explanation: pendingFee ? "We are reviewing the translation requirements for the documents you submitted." : "Document by Document Evaluation: $110.00.\nTranslation of the submitted documents: $50.00.\nThis is a sample quote for preview only." }, origin, options);
  }
  const app = {
    id, locale: "en", first_name: "Sample", last_name: "Applicant",
    payment_status: kind === "confirmation" ? "unpaid" : "paid",
    status: kind === "information" ? "needs_information" : kind === "result" ? "completed" : "submitted",
    result: {
      result: "Bachelor's degree",
      reasoning: "Example assessment for template preview only.\nThe submitted education information describes a four-year undergraduate program. This sample is not an actual credential evaluation.",
    },
  };
  return customerEmail(app, education, kind as "confirmation" | "result" | "access" | "information", origin, kind === "information"
    ? "Please provide a clear copy of your final academic transcript and degree certificate.\nInclude all pages and upload the documents through your application page.\n\nThis is a sample request for preview only."
    : "", options);
}
