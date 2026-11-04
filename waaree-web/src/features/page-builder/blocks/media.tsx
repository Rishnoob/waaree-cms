"use client";

import { Files, Film, Image as ImageIcon, PlayCircle } from "lucide-react";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MediaPicker, useMedia } from "@/features/media";
import { cn } from "@/lib/utils/cn";

import { DocumentsSettings, RenderDocuments } from "../documents";
import { bar, Choice, Txt } from "../kit";
import type { BlockDef } from "../types";

const RATIO: Record<string, string> = { wide: "aspect-[16/7]", standard: "aspect-[3/2]", square: "aspect-square" };

export const image: BlockDef = {
  type: "image",
  label: "Picture",
  hint: "A photo with a caption",
  icon: ImageIcon,
  group: "Media",
  defaults: () => ({ src: "", caption: "", shape: "wide" }),
  Render: ({ props, edit }) => (
    <figure>
      {props.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- files come from the media library or any URL
        <img src={props.src} alt={props.caption ?? ""} className={cn("w-full rounded-lg object-cover", RATIO[props.shape ?? "wide"])} />
      ) : (
        <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-green/40 bg-(image:--brand-tint) text-sm text-primary-strong", RATIO[props.shape ?? "wide"])}>
          <ImageIcon aria-hidden className="size-8 text-primary/60" />
          {edit && "Choose a picture on the right"}
        </div>
      )}
      {(edit || props.caption) && <Txt as="figcaption" value={props.caption ?? ""} onChange={edit && ((caption) => edit({ caption }))} placeholder="Caption (optional)" className="mt-3 text-sm text-muted" />}
    </figure>
  ),
  Options: ({ props, onChange }) => (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-foreground">Choose a picture</p>
      <MediaPicker onPick={(url, alt) => onChange(alt && !props.caption ? { src: url, caption: alt } : { src: url })} />
      <Choice label="Shape" value={props.shape ?? "wide"} options={[{ value: "wide", label: "Wide" }, { value: "standard", label: "Standard" }, { value: "square", label: "Square" }]} onChange={(shape) => onChange({ shape })} />
      <Field label="Caption">
        <Input value={props.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} />
      </Field>
    </div>
  ),
  Sketch: () => (
    <div className="flex h-full items-center justify-center rounded-sm bg-[linear-gradient(135deg,#d7eadf,#cfe5f1)]">
      <ImageIcon aria-hidden className="size-1/3 max-h-5 text-primary/50" />
    </div>
  ),
};

/** YouTube, Vimeo, or a video file from the media library. */
function embedOf(url: string): { kind: "iframe" | "file"; src: string } | null {
  const u = url.trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = u.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm)(\?|$)/i.test(u) || u.includes("/media/files/")) return { kind: "file", src: u };
  return null;
}

export const video: BlockDef = {
  type: "video",
  label: "Video",
  hint: "YouTube, Vimeo or an uploaded video",
  icon: PlayCircle,
  group: "Media",
  defaults: () => ({ url: "", caption: "" }),
  Render: ({ props, edit }) => {
    const v = embedOf(props.url ?? "");
    return (
      <figure>
        {v?.kind === "iframe" ? (
          <iframe src={v.src} title={props.caption || "Video"} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" className={cn("aspect-video w-full rounded-lg border-0 bg-black", edit && "pointer-events-none")} />
        ) : v?.kind === "file" ? (
          <video src={v.src} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-green/40 bg-(image:--brand-tint) text-sm text-primary-strong">
            <PlayCircle aria-hidden className="size-10 text-primary/60" />
            {edit && "Paste a YouTube or Vimeo link on the right, or pick an uploaded video"}
          </div>
        )}
        {(edit || props.caption) && <Txt as="figcaption" value={props.caption ?? ""} onChange={edit && ((caption) => edit({ caption }))} placeholder="Caption (optional)" className="mt-3 text-sm text-muted" />}
      </figure>
    );
  },
  Options: ({ props, onChange }) => <VideoOptions url={props.url ?? ""} onChange={onChange} />,
  Sketch: () => (
    <div className="flex h-full items-center justify-center rounded-sm bg-[#1f2a26]">
      <PlayCircle aria-hidden className="size-1/3 max-h-5 text-white/80" />
    </div>
  ),
};

function VideoOptions({ url, onChange }: { url: string; onChange: (p: Record<string, string>) => void }) {
  const media = useMedia();
  const videos = (media.data ?? []).filter((f) => f.content_type.startsWith("video/"));
  return (
    <div className="flex flex-col gap-4">
      <Field label="Video link" hint="A YouTube or Vimeo address">
        <Input value={url} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => onChange({ url: e.target.value })} />
      </Field>
      {videos.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Or an uploaded video</p>
          <ul className="flex flex-col gap-1">
            {videos.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => onChange({ url: f.url })} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-brand-green/5", url === f.url && "bg-brand-green/10 font-medium")}>
                  <Film aria-hidden className="size-4 text-primary" /> <span className="truncate">{f.original_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const documents: BlockDef = {
  type: "documents",
  label: "Downloads",
  hint: "Reports, PDFs and videos with a year filter",
  icon: Files,
  group: "Media",
  defaults: () => ({ title: "Downloads", items: "[]" }),
  Render: ({ props }) => <RenderDocuments title={props.title ?? ""} items={props.items ?? "[]"} />,
  Options: ({ props, onChange }) => <DocumentsSettings title={props.title ?? ""} items={props.items ?? "[]"} onChange={onChange} />,
  Sketch: () => (
    <div className="grid h-full grid-cols-3 items-center gap-[5%] px-[8%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex h-3/5 items-center gap-1 rounded-sm border border-[#d5dfdb] bg-white px-1">
          <span className="size-1.5 shrink-0 rounded-[2px] bg-brand-green/60" />
          <span className={cn(bar, "h-1 flex-1")} />
        </span>
      ))}
    </div>
  ),
};
