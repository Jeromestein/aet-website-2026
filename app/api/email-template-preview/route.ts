import { confirmationEmail } from "@/lib/application/intake-template";
import { initialDraft } from "@/lib/application/model";
import { selectEvaluationService } from "@/lib/application/evaluation";
import { intakeQuote } from "@/lib/application/intake";
import { feeUpdateEmail, paymentConfirmationEmail } from "@/lib/evaluation-application/email-template";
import { initialData } from "@/lib/evaluation-application/domain";
import { customerEmail } from "@/lib/preeval/email-template";

export const runtime = "nodejs";

const templates = [
  { id: "intake", title: "正式申请确认", description: "申请保存后发送，包含服务、学历及费用估算。" },
  { id: "payment", title: "付款确认", description: "付款确认后发送，包含实际收款金额、付款日期和付款编号。" },
  { id: "fee_update", title: "费用调整通知", description: "服务报价调整后发送，包含最新费用、调整说明和申请入口。" },
  { id: "confirmation", title: "预评估申请确认", description: "预评估申请提交后发送，包含费用及申请入口。" },
  { id: "result", title: "预评估结果", description: "付款完成且结果可提供时发送，包含初步结论与评估依据。" },
  { id: "information", title: "补充材料请求", description: "需要补充资料时发送，包含工作人员提出的具体要求。" },
  { id: "access", title: "申请查询链接", description: "重新提供申请编号与查询入口，方便申请人查看进度。" },
] as const;
type Kind = typeof templates[number]["id"];

async function sampleEmail(kind: Kind, assetOrigin: string, pendingFee: boolean) {
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
  if (kind === "payment" || kind === "fee_update") {
    const data = initialData();
    data.client.name = "Sample Applicant";
    data.evaluee.first = "Sample";
    data.evaluee.last = "Applicant";
    data.services.document.tier = "standard";
    data.services.translation = true;
    const formal = { id, locale: "en", data };
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
  return customerEmail(app, education, kind, origin, kind === "information"
    ? "Please provide a clear copy of your final academic transcript and degree certificate.\nInclude all pages and upload the documents through your application page.\n\nThis is a sample request for preview only."
    : "", options);
}

const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const url = new URL(request.url);
  const selected = templates.find((item) => item.id === url.searchParams.get("kind")) ?? templates[0];
  const mobile = url.searchParams.get("view") === "mobile";
  const pendingFee = url.searchParams.get("scenario") === "pending";
  const mail = await sampleEmail(selected.id, url.origin, pendingFee);
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (url.searchParams.get("raw") === "1") return new Response(mail.html, { headers });
  const href = (kind: Kind, narrow = mobile) => `?kind=${kind}&amp;view=${narrow ? "mobile" : "desktop"}${kind === "fee_update" && pendingFee ? "&amp;scenario=pending" : ""}`;
  return new Response(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AET · 全部邮件模板预览</title><style>
  *{box-sizing:border-box}body{margin:0;background:#eef3f8;color:#18334e;font-family:Arial,"PingFang SC",sans-serif}a{color:inherit}header{padding:28px 32px;background:#fff;border-bottom:1px solid #d9e5ef}header p{margin:8px 0 0;color:#5b6d7e;font-size:14px;line-height:1.6}h1{font-size:24px;margin:0}main{display:grid;grid-template-columns:250px minmax(0,1fr);gap:28px;padding:28px 32px;max-width:1440px;margin:auto}nav{align-self:start;position:sticky;top:24px}nav a{display:flex;gap:14px;text-decoration:none;padding:16px 14px;border-radius:10px;margin-bottom:6px;font-size:14px}nav a[aria-current=page]{background:#18334e;color:white}nav a:hover{box-shadow:inset 0 0 0 1px #507fa6}nav span{opacity:.6;font-size:12px;padding-top:2px}.note{font-size:12px;color:#5b6d7e;line-height:1.8;padding:12px 14px}.toolbar{display:flex;justify-content:space-between;align-items:start;gap:16px;margin-bottom:16px}h2{margin:0 0 8px;font-size:21px}.description{font-size:14px;color:#5b6d7e;line-height:1.7;margin:0}.modes{display:flex;border:1px solid #c6d5e2;background:white;border-radius:8px;padding:4px;flex-shrink:0}.modes a{font-size:13px;padding:8px 12px;text-decoration:none;border-radius:5px}.modes a[aria-current=true]{background:#eaf4fc;font-weight:700}.subject{padding:16px 20px;border:1px solid #d9e5ef;border-radius:12px 12px 0 0;background:white;font-size:14px;line-height:1.6}.subject small{display:block;font-size:11px;letter-spacing:1px;color:#5b6d7e;margin-bottom:4px}.stage{padding:24px;background:#dfe8f0;border:1px solid #d9e5ef;border-top:0;border-radius:0 0 12px 12px;overflow:auto}iframe{display:block;width:${mobile ? "390px" : "100%"};max-width:100%;height:1800px;border:0;margin:auto;background:#f8fbfe;box-shadow:0 4px 24px #18334e0c}.frame-label{text-align:center;color:#5b6d7e;font-size:12px;margin:0 0 14px}.raw{display:inline-block;font-size:13px;margin-top:16px;color:#507fa6}@media(max-width:760px){header{padding:22px 18px}main{display:block;padding:18px}nav{position:static;display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:22px}nav a{font-size:12px;padding:12px 8px;margin:0;gap:8px}.note{grid-column:1/-1;margin:0;padding:8px}.toolbar{flex-wrap:wrap}.stage{padding:12px 0}h1{font-size:21px}}@media(prefers-reduced-motion:no-preference){a{transition:background .15s}}
  </style></head><body><header><h1>AET · 邮件模板预览</h1><p>共 7 个业务模板 · 当前代码实际渲染 · 使用虚构申请数据，不发送邮件</p></header><main><nav aria-label="邮件模板">${templates.map((item, i) => `<a href="${href(item.id)}" ${item.id === selected.id ? 'aria-current="page"' : ""}><span>0${i + 1}</span>${item.title}</a>`).join("")}<p class="note">邮件正文保留当前英文版本。<br>示例按钮不连接真实申请。<br>后台仅用账号密码登录。</p></nav><section><div class="toolbar"><div><h2>${selected.title}</h2><p class="description">${selected.description}</p></div><div class="modes" aria-label="预览宽度"><a href="${href(selected.id, false)}" aria-current="${!mobile}">桌面</a><a href="${href(selected.id, true)}" aria-current="${mobile}">手机</a></div></div>${selected.id === "fee_update" ? `<p class="description" style="margin-bottom:16px">金额状态：<a href="?kind=fee_update&amp;view=${mobile ? "mobile" : "desktop"}">报价已确认</a> · <a href="?kind=fee_update&amp;scenario=pending&amp;view=${mobile ? "mobile" : "desktop"}">等待报价</a></p>` : ""}<div class="subject"><small>SUBJECT / 邮件主题</small>${escape(mail.subject)}</div><div class="stage"><p class="frame-label">${mobile ? "390 px · 手机视图" : "桌面视图 · 邮件内容最大宽度 600 px"}</p><iframe title="${selected.title}邮件正文" sandbox="allow-same-origin" src="?kind=${selected.id}&amp;raw=1${pendingFee ? "&amp;scenario=pending" : ""}"></iframe></div><a class="raw" href="?kind=${selected.id}&amp;raw=1${pendingFee ? "&amp;scenario=pending" : ""}" target="_blank" rel="noopener">单独打开这封邮件 ↗</a></section></main><script>
const frame = document.querySelector('iframe');
function fitEmail() {
  const body = frame.contentDocument?.body; if (!body) return;
  const contentBottom = Math.max(0, ...Array.from(body.children, child => child.getBoundingClientRect().bottom + frame.contentWindow.scrollY));
  frame.style.height = Math.max(640, Math.ceil(contentBottom) + 8) + 'px';
}
frame.addEventListener('load', fitEmail); window.addEventListener('resize', fitEmail);
</script></body></html>`, { headers });
}
