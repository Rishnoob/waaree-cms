import { redirect } from "next/navigation";

// a redirect that reads ?next, so it renders on request (not prerendered)
export const instant = false;

/** Sign-in belongs to the whole website now: old /cms/login links go to /login (keeping ?next). */
export default async function CmsLoginRedirect({ searchParams }: PageProps<"/cms/login">) {
  const next = (await searchParams).next;
  redirect(typeof next === "string" ? `/login?next=${encodeURIComponent(next)}` : "/login");
}
