import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { getAccessToken } from "@/lib/auth/session";
import { env } from "@/lib/env";

export type MediaFile = components["schemas"]["MediaOut"];

const KEY = ["media"] as const;

export function useMedia(q?: string) {
  return useQuery({
    queryKey: [...KEY, q ?? ""],
    queryFn: async () => unwrap(await api.GET("/media", { params: { query: { q: q || undefined } } })),
  });
}

/** Multipart upload (openapi-fetch sends JSON, so this one uses fetch directly). */
export function useUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder || "general");
      const token = await getAccessToken();
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/media`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = (await res.json()) as MediaFile | { error: { message: string } };
      if (!res.ok) throw new Error("error" in data ? data.error.message : "Upload failed");
      return data as MediaFile;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => unwrap(await api.DELETE("/media/{file_id}", { params: { path: { file_id: id } } })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}
