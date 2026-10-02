import { copy } from "@/lib/preeval/copy";
import type { Metadata } from "next";
import PreEvaluationShell from "@/components/preeval/shell";
import { AccessForm } from "@/components/preeval/customer";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: copy(locale).adminTitle + " | AET",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <PreEvaluationShell locale={locale} narrow>
      <AccessForm locale={locale} admin />
    </PreEvaluationShell>
  );
}
