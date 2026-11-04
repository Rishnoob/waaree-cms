import { Users } from "lucide-react";

import type { NavItem } from "@/features/cms-shell";

/** Team = the people (users) and what they can do (roles), on one screen. */
export const usersNav: NavItem[] = [
  { label: "People", href: "/cms/team", description: "Who can sign in, and what they can do", icon: Users, permission: "users.view", group: "admin", order: 10 },
];
