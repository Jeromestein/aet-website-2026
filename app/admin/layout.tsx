import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isEvalEnabled, isLocalHost } from "@/lib/eval/server";
import "../fonts.css";
import "../theme.css";
import "./eval/eval.css";
export const metadata: Metadata = {
  title: "AET Eval",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isEvalEnabled() || !isLocalHost((await headers()).get("host") || ""))
    notFound();
  return (
    <html lang="en">
      <body className="eval-body">{children}</body>
    </html>
  );
}
