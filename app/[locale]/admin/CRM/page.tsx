import type { Metadata } from "next";
import PreEvaluationWorkspace from "@/components/preeval/workspace";
import PreEvaluationShell from "@/components/preeval/shell";
import { session } from "@/lib/preeval/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AET Workspace — Pre-Evaluations",
  description: "Manage pre-evaluation applications and preliminary results.",
  robots: { index: false, follow: false },
};

export default async function CRMPage() {
  if ((await session())?.role !== "admin") redirect("/admin/login");
  return (
    <PreEvaluationShell locale="en" workspace staff>
      <PreEvaluationWorkspace />
    </PreEvaluationShell>
  );
}
