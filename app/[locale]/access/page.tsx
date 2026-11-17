import { requireApplicationPage } from '@/lib/application-page-access';
import { copy } from "@/lib/preeval/copy";
import type { Metadata } from "next";
import ApplicationShell from "@/components/evaluation-application/shell";
import { EvaluationAccess } from "@/components/evaluation-application/access";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: copy(locale).accessTitle + " | AET",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  requireApplicationPage(true);

  const { locale } = await params;
  return (
    <ApplicationShell locale={locale} languages={false}>
      <EvaluationAccess locale={locale} preEvaluation />
    </ApplicationShell>
  );
}
