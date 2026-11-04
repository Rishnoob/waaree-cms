import { FileText } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

export const pagesNav: NavItem[] = [
  { label: "Pages", href: "/cms", description: "Every page, and the website menu", icon: FileText, permission: "pages.view", group: "content", order: 10 },
];
