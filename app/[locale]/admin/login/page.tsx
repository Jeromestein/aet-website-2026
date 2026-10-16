import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PreEvaluationShell from "@/components/preeval/shell";
import StaffAuthForm from "@/components/staff/auth-form";
import { staffSession } from "@/lib/staff/session";
import { safeStaffRedirect } from "@/lib/staff/password";
export const metadata: Metadata = {
  title: "Sign in to AET Workspace | AET",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: returnTo } = await searchParams;
  if (await staffSession()) redirect(safeStaffRedirect(returnTo));
  return (
    <PreEvaluationShell locale="en" narrow staff>
      <StaffAuthForm
        returnTo={safeStaffRedirect(returnTo)}
        allowEmailFallback={process.env.STAFF_AUTH_CUTOVER_ENABLED !== "true"}
      />
    </PreEvaluationShell>
  );
}
