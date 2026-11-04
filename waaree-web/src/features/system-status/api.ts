import { api } from "@/lib/api/client";

export type ServiceState = "ok" | "down";

export type SystemStatus = {
  api: ServiceState;
  database: ServiceState;
  version: string | null;
};

/** Never throws: an unreachable API is a status, not an error. */
export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const { data, response } = await api.GET("/health");
    if (data) return { api: data.api, database: data.database, version: data.version };
    // 503 = API up, DB down (body still follows the health shape)
    if (response.status === 503) return { api: "ok", database: "down", version: null };
    return { api: "down", database: "down", version: null };
  } catch {
    return { api: "down", database: "down", version: null };
  }
}
