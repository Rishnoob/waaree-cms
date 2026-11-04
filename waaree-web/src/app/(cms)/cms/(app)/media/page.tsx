import type { Metadata } from "next";

import { MediaLibrary } from "@/features/media";

export const instant = false;

export const metadata: Metadata = { title: "Media library" };

export default function Page() {
  return <MediaLibrary />;
}
