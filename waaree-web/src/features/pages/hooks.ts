import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type CmsPage = components["schemas"]["PageOut"];
export type PageInput = components["schemas"]["PageIn"];
export type PageStatus = "draft" | "in_review" | "approved" | "rejected" | "published";

const KEY = ["pages"] as const;

export function usePages() {
  return useQuery({ queryKey: KEY, queryFn: async () => unwrap(await api.GET("/pages")) });
}

export function usePage(id: number) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => unwrap(await api.GET("/pages/{page_id}", { params: { path: { page_id: id } } })),
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return (page: CmsPage) => {
    qc.setQueryData([...KEY, page.id], page);
    void qc.invalidateQueries({ queryKey: KEY, exact: true });
  };
}

export function useCreatePage() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (body: PageInput) => unwrap(await api.POST("/pages", { body })),
    onSuccess: refresh,
  });
}

export function useSavePage(id: number) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (body: PageInput) => unwrap(await api.PUT("/pages/{page_id}", { params: { path: { page_id: id } }, body })),
    onSuccess: refresh,
  });
}

export type FlowAction = "submit" | "withdraw" | "approve" | "reject" | "publish";

/** submit / withdraw / approve / reject / publish */
export function useWorkflow(id: number) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ action, comment, at }: { action: FlowAction; comment?: string; at?: string }) => {
      const path = { params: { path: { page_id: id } } };
      if (action === "submit") return unwrap(await api.POST("/pages/{page_id}/submit", path));
      if (action === "withdraw") return unwrap(await api.POST("/pages/{page_id}/withdraw", path));
      if (action === "publish") return unwrap(await api.POST("/pages/{page_id}/publish", { ...path, body: { at: at ?? null } }));
      if (action === "approve") return unwrap(await api.POST("/pages/{page_id}/approve", { ...path, body: { comment: comment || null } }));
      return unwrap(await api.POST("/pages/{page_id}/reject", { ...path, body: { comment: comment || null } }));
    },
    onSuccess: refresh,
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => unwrap(await api.DELETE("/pages/{page_id}", { params: { path: { page_id: id } } })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["site-public"] });
    },
  });
}
