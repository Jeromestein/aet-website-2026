import PreEvaluationShell from "@/components/preeval/shell";
import StaffAuthForm from "@/components/staff/auth-form";
export const metadata = {
  title: "Reset password | AET",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return (
    <PreEvaluationShell locale="en" narrow staff>
      <StaffAuthForm mode="forgot-password" />
    </PreEvaluationShell>
  );
}
