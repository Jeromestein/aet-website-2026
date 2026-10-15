import { copy } from "@/lib/preeval/copy";
import type { Metadata } from "next";
import PreEvaluationShell from "@/components/preeval/shell";
import { AccessForm } from "@/components/preeval/customer";

export const metadata: Metadata = {
  title: copy("en").adminTitle + " | AET",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return (
    <PreEvaluationShell locale="en" narrow staff>
      <AccessForm locale="en" admin />
    </PreEvaluationShell>
  );
}
