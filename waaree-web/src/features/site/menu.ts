"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type MenuLink = components["schemas"]["MenuItemOut"];
export type MenuLinkInput = components["schemas"]["MenuItemIn"];

/**
 * Where something sits in the website menu, as one string:
 * "none" | "top" | "section:Company" | "section:Company/Group Business" (a sub-menu) | "item:12".
 */
export type Where = string;

export const whereOf = (m: Pick<MenuLink, "section" | "parent_id" | "column">): Where =>
  m.section ? (m.column ? `section:${m.section}/${m.column}` : `section:${m.section}`) : m.parent_id ? `item:${m.parent_id}` : "top";

export const toParent = (where: Where): { section: string | null; column: string | null; parent_id: number | null } => {
  if (where.startsWith("section:")) {
    const [section = "", column = null] = where.slice(8).split("/", 2) as [string, string?];
    return { section, column: column ?? null, parent_id: null };
  }
  if (where.startsWith("item:")) return { section: null, column: null, parent_id: Number(where.slice(5)) };
  return { section: null, column: null, parent_id: null };
};

/** "Company › Group Business", "Sustainability", "More" (pages placed nowhere else show in More). */
export function placeName(where: Where, groups: { id: number; label: string }[]): string {
  if (where === "none") return "More";
  if (where === "top") return "Main menu";
  if (where.startsWith("section:")) return where.slice(8).replace("/", " › ");
  return groups.find((g) => `item:${g.id}` === where)?.label ?? "Menu";
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["menu"] });
    void qc.invalidateQueries({ queryKey: ["site-public"] });
    void qc.invalidateQueries({ queryKey: ["placement"] });
  };
}

export function useMenu() {
  return useQuery({ queryKey: ["menu"], queryFn: async () => unwrap(await api.GET("/site/menu")) });
}

/** The places something can go: top level, each built-in section, each top-level link. */
export function usePlaces(excludeItemId?: number | null) {
  const menu = useMenu();
  const sections = menu.data?.sections ?? [];
  const tops = (menu.data?.items ?? []).filter((i) => !i.section && !i.parent_id && i.id !== excludeItemId);
  return [
    { value: "top", label: "New item in the main menu" },
    ...sections.map((s) => ({ value: `section:${s}`, label: `Inside ${s}` })),
    ...tops.map((t) => ({ value: `item:${t.id}`, label: `Under ${t.label}` })),
  ];
}

export function useMenuActions() {
  const done = useInvalidate();
  const add = useMutation({ mutationFn: async (body: MenuLinkInput) => unwrap(await api.POST("/site/menu", { body })), onSuccess: done });
  const edit = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: MenuLinkInput }) => unwrap(await api.PUT("/site/menu/{item_id}", { params: { path: { item_id: id } }, body })),
    onSuccess: done,
  });
  const order = useMutation({ mutationFn: async (ids: number[]) => unwrap(await api.PUT("/site/menu/order", { body: ids })), onSuccess: done });
  const remove = useMutation({ mutationFn: async (id: number) => unwrap(await api.DELETE("/site/menu/{item_id}", { params: { path: { item_id: id } } })), onSuccess: done });
  return { add, edit, order, remove };
}

export function usePlacement(pageId: number) {
  const done = useInvalidate();
  const q = useQuery({
    queryKey: ["placement", pageId],
    queryFn: async () => unwrap(await api.GET("/site/placement/{page_id}", { params: { path: { page_id: pageId } } })),
  });
  const save = useMutation({
    mutationFn: async (body: { where: Where; label: string | null }) => unwrap(await api.PUT("/site/placement/{page_id}", { params: { path: { page_id: pageId } }, body })),
    onSuccess: done,
  });
  return { placement: q.data, isLoading: q.isLoading, save };
}
