"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Collection = components["schemas"]["CollectionOut"];
export type CollectionInput = components["schemas"]["CollectionIn"];
export type Field = components["schemas"]["FieldOut"];
export type FieldInput = components["schemas"]["FieldIn"];
export type Item = components["schemas"]["ItemOut"];
export type Version = components["schemas"]["VersionOut"];
export type FieldType = FieldInput["type"];

const KEY = ["collections"] as const;

export function useCollections(archived = false) {
  return useQuery({ queryKey: [...KEY, { archived }], queryFn: async () => unwrap(await api.GET("/collections", { params: { query: { archived } } })) });
}

export function useCollection(key: string, enabled = true) {
  return useQuery({ queryKey: [...KEY, key], enabled: enabled && !!key, queryFn: async () => unwrap(await api.GET("/collections/{key}", { params: { path: { key } } })) });
}

export function useItems(key: string, trash = false, enabled = true) {
  return useQuery({ queryKey: [...KEY, key, "items", { trash }], enabled: enabled && !!key, queryFn: async () => unwrap(await api.GET("/collections/{key}/items", { params: { path: { key }, query: { trash } } })) });
}

export function useVersions(itemId: number | null) {
  return useQuery({
    queryKey: [...KEY, "versions", itemId],
    enabled: itemId !== null,
    queryFn: async () => unwrap(await api.GET("/collections/items/{item_id}/versions", { params: { path: { item_id: itemId! } } })),
  });
}

export function useUsage(key: string) {
  return useQuery({ queryKey: [...KEY, key, "usage"], queryFn: async () => unwrap(await api.GET("/collections/{key}/usage", { params: { path: { key } } })) });
}

/** What the website shows: published rows only (used by the “Data view” block, in the editor too). */
export function usePublicCollection(key: string | undefined, params: { sort?: string; order?: "asc" | "desc"; limit?: number; q?: string }) {
  return useQuery({
    queryKey: ["collection-public", key, params],
    enabled: !!key,
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await api.GET("/collections/public/{key}", { params: { path: { key: key! }, query: { ...params, q: params.q || undefined } } })),
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: KEY });
    void qc.invalidateQueries({ queryKey: ["collection-public"] });
  };
}

export function useStructure(key?: string) {
  const done = useRefresh();
  const path = { params: { path: { key: key ?? "" } } };
  return {
    create: useMutation({ mutationFn: async (body: CollectionInput) => unwrap(await api.POST("/collections", { body })), onSuccess: done }),
    edit: useMutation({ mutationFn: async (body: components["schemas"]["CollectionEdit"]) => unwrap(await api.PUT("/collections/{key}", { ...path, body })), onSuccess: done }),
    archive: useMutation({ mutationFn: async () => unwrap(await api.POST("/collections/{key}/archive", path)), onSuccess: done }),
    unarchive: useMutation({ mutationFn: async () => unwrap(await api.POST("/collections/{key}/unarchive", path)), onSuccess: done }),
    addField: useMutation({ mutationFn: async (body: FieldInput) => unwrap(await api.POST("/collections/{key}/fields", { ...path, body })), onSuccess: done }),
    editField: useMutation({
      mutationFn: async ({ id, body }: { id: number; body: components["schemas"]["FieldEdit"] }) => unwrap(await api.PUT("/collections/{key}/fields/{field_id}", { params: { path: { key: key ?? "", field_id: id } }, body })),
      onSuccess: done,
    }),
    order: useMutation({ mutationFn: async (ids: number[]) => unwrap(await api.PUT("/collections/{key}/fields-order", { ...path, body: ids })), onSuccess: done }),
  };
}

export type Step = "publish" | "submit" | "reject" | "unpublish" | "trash" | "restore";

export function useRows(key: string) {
  const done = useRefresh();
  return {
    add: useMutation({ mutationFn: async (data: Record<string, unknown>) => unwrap(await api.POST("/collections/{key}/items", { params: { path: { key } }, body: { data } })), onSuccess: done }),
    save: useMutation({ mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => unwrap(await api.PUT("/collections/items/{item_id}", { params: { path: { item_id: id } }, body: { data } })), onSuccess: done }),
    step: useMutation({
      mutationFn: async ({ id, step, comment }: { id: number; step: Step; comment?: string }) => {
        const path = { params: { path: { item_id: id } } };
        if (step === "publish") return unwrap(await api.POST("/collections/items/{item_id}/publish", { ...path, body: { comment: comment ?? null } }));
        if (step === "reject") return unwrap(await api.POST("/collections/items/{item_id}/reject", { ...path, body: { comment: comment ?? null } }));
        if (step === "submit") return unwrap(await api.POST("/collections/items/{item_id}/submit", path));
        if (step === "unpublish") return unwrap(await api.POST("/collections/items/{item_id}/unpublish", path));
        if (step === "trash") return unwrap(await api.POST("/collections/items/{item_id}/trash", path));
        return unwrap(await api.POST("/collections/items/{item_id}/restore", path));
      },
      onSuccess: done,
    }),
    restoreVersion: useMutation({
      mutationFn: async ({ id, version }: { id: number; version: number }) => unwrap(await api.POST("/collections/items/{item_id}/versions/{version_id}/restore", { params: { path: { item_id: id, version_id: version } } })),
      onSuccess: done,
    }),
    importRows: useMutation({ mutationFn: async (items: Record<string, unknown>[]) => unwrap(await api.POST("/collections/{key}/import", { params: { path: { key } }, body: { items } })), onSuccess: done }),
  };
}
