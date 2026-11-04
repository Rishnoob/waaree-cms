"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { refreshSession, useSession } from "@/lib/auth/session";

/**
 * Shows children only to logged-in users. On first load it restores the session from the refresh
 * cookie; if that fails it sends the user to /login and brings them back afterwards.
 * (UX only. The API enforces every permission itself.)
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session.status === "unknown") void refreshSession();
    if (session.status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [session.status, router, pathname]);

  if (session.status !== "authenticated") {
    return (
      <div aria-busy="true" aria-label="Loading" className="flex flex-1 gap-6 p-6">
        <Skeleton className="hidden h-full w-60 rounded-lg md:block" />
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }
  return children;
}
