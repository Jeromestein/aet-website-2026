import { Button, Column, Heading, Hr, Row, Section, Text } from "react-email";
import type { CSSProperties, ReactNode } from "react";
import { mailColors as colors } from "./branded-layout";

export const paragraph: CSSProperties = { margin: "0 0 16px", fontSize: "15px", lineHeight: "25px", color: colors.muted };
export const label: CSSProperties = { margin: "0 0 10px", fontSize: "11px", lineHeight: "16px", letterSpacing: "1.6px", fontWeight: 600, color: colors.muted };
export function EmailHero({ eyebrow, children, description, action, note }: {
  eyebrow: string; children: ReactNode; description: string;
  action: { href: string; label: string }; note?: string;
}) {
  return <Section className="email-gutter email-hero" style={{
    backgroundColor: "#142E45",
    backgroundImage: "radial-gradient(ellipse at 100% 0%, rgba(76, 149, 201, 0.42), transparent 65%), linear-gradient(155deg, #255D88 0%, #163A59 46%, #0C1E30 100%)",
    padding: "38px 36px 40px",
  }}>
    <Text style={{ ...label, color: "#B8D5EA", marginBottom: "16px", letterSpacing: "2px" }}>{eyebrow}</Text>
    <Heading className="email-heading" style={{ margin: 0, fontSize: "44px", lineHeight: "48px", letterSpacing: "-1.6px", fontWeight: 600, color: "#FFFFFF" }}>{children}</Heading>
    <Text style={{ margin: "18px 0 26px", fontSize: "15px", lineHeight: "24px", color: "#D7E6F1", maxWidth: "410px" }}>{description}</Text>
    <Button href={action.href} style={{ backgroundColor: colors.orange, color: "#FFFFFF", padding: "15px 24px", borderRadius: "28px", fontSize: "14px", lineHeight: "20px", fontWeight: 600, textDecoration: "none" }}>{action.label}</Button>
    {note && <Text style={{ margin: "15px 0 0", fontSize: "11px", lineHeight: "18px", color: "#B8CFDF" }}>{note}</Text>}
  </Section>;
}
export function EmailContent({ children }: { children: ReactNode }) {
  return <Section className="email-gutter" style={{ padding: "28px 36px 30px" }}>{children}</Section>;
}
export function EmailReference({ id }: { id: string }) {
  return <Section style={{ margin: "24px 0 18px", paddingBottom: "16px", borderBottom: `1px solid ${colors.line}` }}><Text style={{ ...label, marginBottom: "6px" }}>APPLICATION ID</Text><Text style={{ margin: 0, fontSize: "12px", lineHeight: "19px", fontFamily: "Consolas, Monaco, monospace", color: colors.muted, wordBreak: "break-all" }}>{id}</Text></Section>;
}
export function EmailDetail({ title, children }: { title: string; children: ReactNode }) {
  return <Row><Column className="email-detail-label" style={{ width: "116px", verticalAlign: "top", padding: "7px 12px 7px 0", color: colors.muted, fontSize: "13px", lineHeight: "21px" }}>{title}</Column><Column style={{ padding: "7px 0", fontSize: "14px", lineHeight: "21px", color: colors.ink, verticalAlign: "top", overflowWrap: "anywhere" }}>{children}</Column></Row>;
}
export function EmailHeading({ children }: { children: ReactNode }) {
  return <Heading as="h2" style={{ margin: "0 0 12px", fontSize: "18px", lineHeight: "25px", fontWeight: 600, letterSpacing: "-0.4px" }}>{children}</Heading>;
}
export function EmailPanel({ children }: { children: ReactNode }) {
  return <Section style={{ margin: "22px 0", padding: "20px 22px", backgroundColor: colors.blue, borderRadius: "10px" }}>{children}</Section>;
}
export function EmailDivider() { return <Hr style={{ borderColor: colors.line, margin: "24px 0" }} />; }
export function EmailSignoff() { return <Text style={{ margin: "22px 0 0", fontSize: "14px", lineHeight: "22px", color: colors.muted }}>Best regards,<br /><strong style={{ color: colors.ink }}>The AET Team</strong></Text>; }
export function EmailAmount({ title, cents, children }: { title: string; cents: number; children?: ReactNode }) {
  return <Section style={{ margin: "22px 0", padding: "20px 0", borderTop: `1px solid ${colors.line}`, borderBottom: `1px solid ${colors.line}` }}><Text style={{ ...label, marginBottom: "7px", letterSpacing: "1px" }}>{title}</Text><Text style={{ margin: "0 0 7px", fontSize: "28px", lineHeight: "34px", fontWeight: 600, letterSpacing: "-0.7px" }}>{money(cents)}<span style={{ fontSize: "12px", fontWeight: 400, letterSpacing: 0, paddingLeft: "6px" }}>USD</span></Text>{children}</Section>;
}
export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
export const privateIdNote = "Keep your Application ID private. It opens your application without an account.";
