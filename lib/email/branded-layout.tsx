import { Body, Container, Font, Head, Html, Img, Link, Preview, Section, Text } from "react-email";
import type { ReactNode } from "react";
import { emailAssetOrigin } from "./assets";

export const mailFont = '"Poppins", Arial, Helvetica, sans-serif';

export const mailColors = {
  paper: "#F2F5F9", blue: "#F1F6FB", ink: "#18334E", muted: "#5B6D7E",
  line: "#D9E5EF", orange: "#C7471D", footer: "#F7F9FC",
};

export function BrandedEmailLayout({ children, origin, assetOrigin = emailAssetOrigin(), statusUrl, preview, notice }: {
  children: ReactNode; origin: string; assetOrigin?: string; statusUrl: string; preview: string; notice?: string;
}) {
  const site = origin.replace(/\/$/, "");
  return (
    <Html lang="en">
      <Head>
        {[400, 600, 700].map(weight => <Font key={weight} fontFamily="Poppins" fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]} fontWeight={weight} webFont={{ url: `${assetOrigin.replace(/\/$/, "")}/fonts/poppins-${weight}-latin.woff2`, format: "woff2" }} />)}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media only screen and (max-width: 480px) {
            .email-shell > tbody > tr > td { padding: 12px 8px !important; }
            .email-gutter > tbody > tr > td { padding-left: 24px !important; padding-right: 24px !important; }
            .email-heading { font-size: 34px !important; line-height: 39px !important; letter-spacing: -1.1px !important; }
            .email-hero > tbody > tr > td { padding-top: 32px !important; padding-bottom: 34px !important; }
            .email-logo { width: 254px !important; height: auto !important; }
            .email-detail-label { width: 90px !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: mailColors.paper, color: mailColors.ink, fontFamily: mailFont }}>
        <Section className="email-shell" style={{ padding: "28px 12px" }}>
          <Container style={{ width: "100%", maxWidth: "600px", backgroundColor: "#FFFFFF", border: `1px solid ${mailColors.line}`, borderRadius: "12px", overflow: "hidden" }}>
            <Section className="email-gutter" style={{ padding: "20px 36px" }}>
              <Link href={site}>
                <Img className="email-logo" src={`${assetOrigin.replace(/\/$/, "")}/brand/aet-logo-header.png`} width="286" height="66" alt="American Education and Translation Services,CORP (AET)" style={{ display: "block", maxWidth: "100%", height: "auto" }} />
              </Link>
            </Section>
            {children}
            <Section className="email-gutter" style={{ padding: "24px 36px", backgroundColor: mailColors.footer, borderTop: `1px solid ${mailColors.line}` }}>
              <Text style={{ margin: "0 0 10px", color: mailColors.ink, fontSize: "12px", lineHeight: "19px", fontWeight: 600 }}>American Education and<br />Translation Services, CORP (AET)</Text>
              <Text style={{ margin: "0 0 14px", color: mailColors.muted, fontSize: "12px", lineHeight: "20px" }}>Questions about your application? We’re here to help.</Text>
              <Text style={{ margin: 0, fontSize: "12px", lineHeight: "26px" }}>
                {[['Website', site], ['Application status', statusUrl], ['Contact', site + '/contact'], ['Privacy', site + '/privacy']].map(([label, href]) =>
                  <Link key={label} href={href} style={{ color: mailColors.ink, textDecoration: "underline", display: "inline-block", marginRight: "18px" }}>{label}</Link>,
                )}
              </Text>
            </Section>
          </Container>
          {notice && <Container style={{ maxWidth: "540px", padding: "16px 16px 0" }}>
            <Text style={{ margin: 0, fontSize: "11px", lineHeight: "17px", textAlign: "center", color: mailColors.muted }}>
              {notice}
            </Text>
          </Container>}
        </Section>
      </Body>
    </Html>
  );
}
