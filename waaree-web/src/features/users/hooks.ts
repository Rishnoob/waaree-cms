import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type User = components["schemas"]["UserOut"];
export type UserCreate = components["schemas"]["UserCreateIn"];
export type UserUpdate = components["schemas"]["UserUpdateIn"];

const KEY = ["users"] as const;

export function useUsers() {
  return useQuery({ queryKey: KEY, queryFn: async () => unwrap(await api.GET("/users")) });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UserCreate) => unwrap(await api.POST("/users", { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UserUpdate }) =>
      unwrap(await api.PATCH("/users/{user_id}", { params: { path: { user_id: id } }, body })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ["roles"] }); // user counts change
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) =>
      unwrap(await api.POST("/users/{user_id}/password", { params: { path: { user_id: id } }, body: { password } })),
  });
}
