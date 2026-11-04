import type { Metadata } from "next";

import { TeamScreen } from "@/features/users/components/TeamScreen";

export const instant = false;

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return <TeamScreen />;
}
