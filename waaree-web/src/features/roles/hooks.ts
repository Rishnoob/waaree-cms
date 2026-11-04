import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Role = components["schemas"]["RoleOut"];
export type PermissionGroup = components["schemas"]["PermissionGroup"];
export type RoleInput = components["schemas"]["RoleIn"];

const KEY = ["roles"] as const;

export function useRoles(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: async () => unwrap(await api.GET("/roles")), enabled });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: [...KEY, "permissions"],
    queryFn: async () => unwrap(await api.GET("/roles/permissions")),
    staleTime: 5 * 60_000,
  });
}

export function useSaveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: number; body: RoleInput }) =>
      id
        ? unwrap(await api.PATCH("/roles/{role_id}", { params: { path: { role_id: id } }, body }))
        : unwrap(await api.POST("/roles", { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      unwrap(await api.DELETE("/roles/{role_id}", { params: { path: { role_id: id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
