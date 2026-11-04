import type { Metadata } from "next";

import { PageEditor } from "@/features/pages";

export const instant = false;

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPagePage({ params }: PageProps<"/cms/pages/[id]">) {
  const { id } = await params;
  return <PageEditor id={Number(id)} />;
}
