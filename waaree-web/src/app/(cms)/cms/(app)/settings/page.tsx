import type { Metadata } from "next";

import { SettingsScreen } from "@/features/site";

export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsScreen />;
}
