import type { Metadata } from "next";

import { CollectionScreen } from "@/features/collections";

export const instant = false;

export const metadata: Metadata = { title: "Collection" };

export default async function CollectionPage({ params }: PageProps<"/cms/data/[key]">) {
  const { key } = await params;
  return <CollectionScreen collectionKey={key} />;
}
