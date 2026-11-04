import type { Metadata } from "next";

import { AuditLog } from "@/features/audit";

export const instant = false;

export const metadata: Metadata = { title: "Audit log" };

export default function AuditPage() {
  return <AuditLog />;
}
