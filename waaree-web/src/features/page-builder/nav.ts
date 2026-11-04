import { Shapes } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

export const uiKitNav: NavItem[] = [
  { label: "UI Kit", href: "/cms/ui-kit", description: "Building blocks, and your own custom blocks", icon: Shapes, permission: "pages.view", group: "content", order: 12 },
];
