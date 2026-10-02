import type { Metadata } from "next";
import CRMPreview from "@/components/crm/crm-preview";
import { session } from "@/lib/preeval/auth";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Other Services Preview | AET",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if ((await session())?.role !== "admin") redirect("/admin/login");
  return <CRMPreview />;
}
