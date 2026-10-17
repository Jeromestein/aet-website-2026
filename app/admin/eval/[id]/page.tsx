import { EvalEditor } from "@/components/eval/editor";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== "new" && !/^[a-f0-9-]{36}$/.test(id)) notFound();
  return <EvalEditor key={id} reportId={id} />;
}
