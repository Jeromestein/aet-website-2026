import { copy } from "@/lib/preeval/copy";
import type { Metadata } from "next";
import PreEvaluationShell from "@/components/preeval/shell";
import ApplicationLookup from "@/components/preeval/application-lookup";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: copy(locale).statusTitle + " | AET",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const { locale } = await params,
    { applicationId } = await searchParams;
  return (
    <PreEvaluationShell locale={locale} narrow>
      <ApplicationLookup locale={locale} initialId={applicationId} autoOpen />
    </PreEvaluationShell>
  );
}
