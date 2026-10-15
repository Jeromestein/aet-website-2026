import type { Metadata } from "next";
import PreEvaluationShell from "@/components/preeval/shell";
import { ConsumeLink } from "@/components/preeval/customer";

export const metadata: Metadata = {
  title: "Sign in to AET Workspace | AET",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return (
    <PreEvaluationShell locale="en" narrow staff>
      <ConsumeLink locale="en" admin />
    </PreEvaluationShell>
  );
}
