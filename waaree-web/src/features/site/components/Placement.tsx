"use client";

import { toast } from "@/components/ui/toast";

import { usePlacement } from "../menu";
import { WherePicker } from "./WherePicker";

/** A page’s place in the website menu; saves as soon as you pick. It shows on the site once the page is live. */
export function Placement({ pageId, disabled = false }: { pageId: number; disabled?: boolean }) {
  const { placement, isLoading, save } = usePlacement(pageId);
  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <WherePicker
      value={placement?.where ?? "none"}
      disabled={disabled || save.isPending}
      onChange={async (where) => {
        try {
          await save.mutateAsync({ where, label: null });
          toast.success("Menu updated");
        } catch (e) {
          toast.error((e as Error).message);
        }
      }}
    />
  );
}
