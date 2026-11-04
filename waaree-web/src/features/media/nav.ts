import { Images } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

export const mediaNav: NavItem[] = [
  { label: "Files", href: "/cms/media", description: "Pictures, PDFs and videos", icon: Images, permission: "media.view", group: "content", order: 15 },
];
