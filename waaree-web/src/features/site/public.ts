"use client";

import { useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";

/** Menu links + public settings for the website (no login). */
export function useSitePublic() {
  return useQuery({
    queryKey: ["site-public"],
    queryFn: async () => unwrap(await api.GET("/site/public")),
    staleTime: 60_000,
    retry: false,
  });
}
