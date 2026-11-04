import { RequireAuth } from "@/features/auth";
import { CmsShell } from "@/features/cms-shell";

/**
 * Every CMS screen except login: must be logged in, inside the website’s navbar + the CMS icon rail.
 *
 * The session is restored in the browser (it lives with the API, not this Next server), so pages
 * here can't be prerendered. Each page.tsx below therefore exports `instant = false`. Next needs it
 * on the page itself, not here.
 */
export default function CmsAppLayout({ children }: LayoutProps<"/cms">) {
  return (
    <RequireAuth>
      <CmsShell>{children}</CmsShell>
    </RequireAuth>
  );
}
