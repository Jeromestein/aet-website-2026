import { redirect } from "next/navigation";
import { requireApplicationPage } from "@/lib/application-page-access";
import { pathFor } from "@/lib/preeval/domain";

export const metadata = {robots: {index: false, follow: false}, referrer: "no-referrer"} as const;

type Query = Record<string, string | string[] | undefined>;

export default async function LegacyStatusPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
}) {
  requireApplicationPage(true);
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const retained = new URLSearchParams();
  if (typeof query.applicationId === "string") retained.set("applicationId", query.applicationId);
  if (query.checkout === "success" || query.checkout === "cancelled") retained.set("checkout", query.checkout);
  if (query.upload === "retry") retained.set("upload", "retry");
  redirect(pathFor(locale, "/status") + (retained.size ? "?" + retained.toString() : ""));
}
