import { redirect } from "next/navigation";
import PreEvaluationShell from "@/components/preeval/shell";
import { AccessForm } from "@/components/preeval/customer";
export const metadata = {
  title: "AET Workspace sign-in",
  robots: { index: false, follow: false },
};
export default function Page() {
  if (process.env.STAFF_AUTH_CUTOVER_ENABLED === "true")
    redirect("/admin/login");
  return (
    <PreEvaluationShell locale="en" narrow staff>
      <AccessForm locale="en" admin />
    </PreEvaluationShell>
  );
}
