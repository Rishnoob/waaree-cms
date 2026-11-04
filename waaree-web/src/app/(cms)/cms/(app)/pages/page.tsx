import type { Metadata } from "next";

import { PagesScreen } from "@/features/pages";

// Behind the login check (RequireAuth), so it can't be prerendered for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Pages" };

/** The CMS home: every page, with filters, and the website menu. */
export default function PagesPage() {
  return <PagesScreen />;
}
