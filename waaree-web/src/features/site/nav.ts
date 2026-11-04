import { Settings } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

export const siteNav: NavItem[] = [
  { label: "Settings", href: "/cms/settings", description: "Site-wide details and switches", icon: Settings, permission: "settings.manage", group: "admin", order: 40 },
];
