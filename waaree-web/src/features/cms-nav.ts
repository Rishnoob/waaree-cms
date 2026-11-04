/**
 * The CMS menu is built from each feature's nav.ts. When you add a feature with a screen,
 * add ONE line here. Removing a feature = remove its line. Nothing else changes.
 * Kept deliberately short: Pages · UI Kit · Data · Files · People · Activity · Settings.
 */
import { auditNav } from "@/features/audit/nav";
import { dataNav } from "@/features/collections/nav";
import type { NavItem } from "@/features/cms-shell/nav-types";
import { mediaNav } from "@/features/media/nav";
import { uiKitNav } from "@/features/page-builder/nav";
import { pagesNav } from "@/features/pages/nav";
import { siteNav } from "@/features/site/nav";
import { usersNav } from "@/features/users/nav";

export const cmsNav: NavItem[] = [...pagesNav, ...uiKitNav, ...dataNav, ...mediaNav, ...usersNav, ...auditNav, ...siteNav];
