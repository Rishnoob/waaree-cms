import type { CmsPage } from "./hooks";

/**
 * A page's state in plain words, the same everywhere: a short label (for lists), a tone (dot colour)
 * and a sentence (for the editor's top bar). Scheduled pages say when they go live, not "Published".
 */
export type Tone = "grey" | "amber" | "red" | "blue" | "green";
export type PageState = { label: string; tone: Tone; sentence: string };

const date = (iso: string) => new Date(iso + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Published for a future time. (Judged by the last publish step, so a few seconds of clock difference
 * between the server and this browser never makes “Publish now” look scheduled.) */
export const isScheduled = (p: CmsPage) =>
  p.status === "published" &&
  !!p.published_at &&
  [...p.events].reverse().find((e) => e.action === "published" || e.action === "scheduled")?.action === "scheduled" &&
  new Date(p.published_at + "Z") > new Date();

export function pageState(p: CmsPage): PageState {
  switch (p.status) {
    case "in_review":
      return { label: "Waiting for approval", tone: "amber", sentence: "Sent for approval. Editing is paused until it’s reviewed." };
    case "rejected":
      return { label: "Needs changes", tone: "red", sentence: "Sent back with a note. Make the changes, then send it again." };
    case "approved":
      return { label: "Approved", tone: "blue", sentence: "Approved and ready to publish." };
    case "published":
      return isScheduled(p)
        ? { label: `Goes live ${date(p.published_at!)}`, tone: "blue", sentence: `Approved. It goes live on ${date(p.published_at!)}.` }
        : { label: "Live", tone: "green", sentence: "Live on the website." };
    default:
      return p.has_live
        ? { label: "Live · changes not sent", tone: "green", sentence: "Visitors still see the live version. Your changes go live once they’re approved." }
        : { label: "Draft", tone: "grey", sentence: "Draft. Only your team can see it." };
  }
}

export const DOT: Record<Tone, string> = {
  grey: "bg-[#b9c1bd]",
  amber: "bg-[#f59e0b]",
  red: "bg-danger",
  blue: "bg-brand-blue",
  green: "bg-brand-green",
};
