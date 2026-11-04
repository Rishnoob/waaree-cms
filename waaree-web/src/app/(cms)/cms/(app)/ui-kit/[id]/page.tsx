import type { Metadata } from "next";

import { CustomBlockEditor } from "@/features/page-builder";

export const instant = false;

export const metadata: Metadata = { title: "Custom block" };

export default async function CustomBlockPage({ params }: PageProps<"/cms/ui-kit/[id]">) {
  const { id } = await params;
  return <CustomBlockEditor id={Number(id)} />;
}
