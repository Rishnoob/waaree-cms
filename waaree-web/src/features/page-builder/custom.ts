"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

/** Custom blocks: your own reusable sections, made in the UI Kit. Inserting one copies it into the page. */
export type CustomBlock = components["schemas"]["BlockOut"];
export type CustomBlockInput = components["schemas"]["BlockIn"];

const KEY = ["custom-blocks"] as const;

export function useCustomBlocks() {
  return useQuery({ queryKey: KEY, queryFn: async () => unwrap(await api.GET("/blocks")) });
}

export function useCustomBlock(id: number) {
  return useQuery({ queryKey: [...KEY, id], queryFn: async () => unwrap(await api.GET("/blocks/{block_id}", { params: { path: { block_id: id } } })) });
}

export function useCustomBlockActions() {
  const qc = useQueryClient();
  const done = () => void qc.invalidateQueries({ queryKey: KEY, exact: true });
  const create = useMutation({ mutationFn: async (body: CustomBlockInput) => unwrap(await api.POST("/blocks", { body })), onSuccess: done });
  const save = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: CustomBlockInput }) => unwrap(await api.PUT("/blocks/{block_id}", { params: { path: { block_id: id } }, body })),
    onSuccess: (b) => {
      qc.setQueryData([...KEY, b.id], b);
      done();
    },
  });
  const remove = useMutation({ mutationFn: async (id: number) => unwrap(await api.DELETE("/blocks/{block_id}", { params: { path: { block_id: id } } })), onSuccess: done });
  return { create, save, remove };
}
