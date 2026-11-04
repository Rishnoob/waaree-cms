import type { Metadata } from "next";

import { UiKit } from "@/features/page-builder";

export const instant = false;

export const metadata: Metadata = { title: "UI Kit" };

export default function UiKitPage() {
  return <UiKit />;
}
