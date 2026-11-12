import { requireApplicationPage } from '@/lib/application-page-access';
import { copy } from "@/lib/preeval/copy";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pathFor } from "@/lib/preeval/domain";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: copy(locale).start + " | AET",
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
  redirect(pathFor(locale, '/application') + '?service=pre-evaluation');
}
