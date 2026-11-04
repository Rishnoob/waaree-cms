import type { Metadata } from "next";

import { DataHome } from "@/features/collections";

export const instant = false;

export const metadata: Metadata = { title: "Data" };

export default function DataPage() {
  return <DataHome />;
}
