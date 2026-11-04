import { ScrollText } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

export const auditNav: NavItem[] = [
  { label: "Activity", href: "/cms/audit", description: "Who changed what, and when", icon: ScrollText, permission: "audit.view", group: "admin", order: 30 },
];
