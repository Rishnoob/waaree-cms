import { useQuery } from "@tanstack/react-query";

import { fetchSystemStatus } from "./api";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    refetchInterval: 15_000,
  });
}
