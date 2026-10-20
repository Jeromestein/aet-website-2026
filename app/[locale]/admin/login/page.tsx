import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PreEvaluationShell from "@/components/preeval/shell";
import StaffAuthForm from "@/components/staff/auth-form";
import StaffUnavailable from "@/components/staff/unavailable";
import { AppError } from "@/lib/preeval/domain";
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
  let staff;
  try { staff = await staffSession(); }
  catch (error) {
    if (error instanceof AppError && error.code === "service_unavailable") return <StaffUnavailable/>;
    throw error;
  }
  if (staff) redirect(safeStaffRedirect(returnTo));
  return (
    <PreEvaluationShell locale="en" narrow staff>
      <StaffAuthForm
        returnTo={safeStaffRedirect(returnTo)}
      />
    </PreEvaluationShell>
  );
}
