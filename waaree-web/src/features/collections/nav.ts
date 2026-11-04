import { Database } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

export const dataNav: NavItem[] = [
  { label: "Data", href: "/cms/data", description: "Collections: results, posts, openings…", icon: Database, permission: "data.view", group: "content", order: 13 },
];
