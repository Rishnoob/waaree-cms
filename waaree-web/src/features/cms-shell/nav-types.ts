import type { LucideIcon } from "lucide-react";

/** One CMS sidebar entry. Each feature exports its entries from `<feature>/nav.ts`. */
export type NavItem = {
  label: string;
  href: string;
  /** One line shown on the dashboard card. */
  description?: string;
  icon: LucideIcon;
  /** Shown only to users with this permission (omit = every logged-in user). */
  permission?: string;
  group: "main" | "content" | "admin" | "system";
  /** Lower comes first within a group. */
  order: number;
};
