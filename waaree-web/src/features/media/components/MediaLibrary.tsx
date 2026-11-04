"use client";

import { Check, Copy, FileText, Film, Search, Trash2, UploadCloud } from "lucide-react";
import { useDeferredValue, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { type MediaFile, useDeleteMedia, useMedia, useUpload } from "../hooks";

const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

export function Thumb({ f, className }: { f: MediaFile; className?: string }) {
  if (f.content_type.startsWith("image/"))
    // eslint-disable-next-line @next/next/no-img-element -- files come from the API host
    return <img src={f.url} alt={f.alt_text ?? f.original_name} className={cn("size-full object-cover", className)} />;
  const Icon = f.content_type === "application/pdf" ? FileText : Film;
  return (
    <span className={cn("flex size-full items-center justify-center bg-(image:--brand-tint)", className)}>
      <Icon aria-hidden className="size-8 text-primary/70" />
    </span>
  );
}

/** Upload zone: click or drop files. */
export function UploadZone({ onUploaded }: { onUploaded?: (f: MediaFile) => void }) {
  const upload = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const send = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      try {
        const f = await upload.mutateAsync({ file });
        toast.success(`Uploaded ${f.original_name}`);
        onUploaded?.(f);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  };
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void send(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors focus-visible:shadow-glow focus-visible:outline-none",
        over ? "border-brand-green bg-brand-green/5" : "border-border-strong hover:border-brand-green/60",
      )}
    >
      <UploadCloud aria-hidden className="size-7 text-primary" strokeWidth={1.5} />
      <span className="text-sm font-medium text-foreground">{upload.isPending ? "Uploading…" : "Drop files here, or click to choose"}</span>
      <span className="text-xs text-muted">Images, PDFs and MP4/WebM videos, up to 25 MB</span>
      <input ref={input} type="file" multiple hidden accept="image/*,application/pdf,video/mp4,video/webm" onChange={(e) => void send(e.target.files)} />
    </button>
  );
}

/** The media library: upload, search, copy a file’s link, delete. */
export function MediaLibrary() {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const media = useMedia(query);
  const remove = useDeleteMedia();
  const canUpload = useCan("media.upload");
  const [copied, setCopied] = useState<number | null>(null);

  return (
    <div>
      <header>
        <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">Files</h1>
        <p className="mt-2 max-w-xl text-body">Pictures, PDFs and videos for your pages. Upload once, use them on any page.</p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="relative max-w-sm self-start">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Search files" placeholder="Search by file name" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        {canUpload && <UploadZone />}
      </div>

      {media.isLoading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (media.data ?? []).length === 0 ? (
        <p className="mt-8 rounded-lg border border-border p-10 text-center text-muted">No files yet. Upload the first one.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {(media.data ?? []).map((f) => (
            <li key={f.id} className="group overflow-hidden rounded-lg border border-border bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                <Thumb f={f} className="transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex items-center gap-1 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground" title={f.original_name}>
                    {f.original_name}
                  </span>
                  <span className="block text-xs text-muted">{size(f.size_bytes)}</span>
                </span>
                <IconButton
                  label={`Copy link to ${f.original_name}`}
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(f.url);
                    setCopied(f.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                >
                  {copied === f.id ? <Check aria-hidden /> : <Copy aria-hidden />}
                </IconButton>
                {canUpload && (
                  <IconButton
                    label={`Delete ${f.original_name}`}
                    size="sm"
                    onClick={async () => {
                      if (!confirm(`Delete ${f.original_name}? Pages using it will show a blank image.`)) return;
                      await remove.mutateAsync(f.id);
                      toast.success("Deleted");
                    }}
                  >
                    <Trash2 aria-hidden />
                  </IconButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pick an image from the library (or upload one) – used by the Image block. */
export function MediaPicker({ onPick }: { onPick: (url: string, alt: string) => void }) {
  const media = useMedia();
  const images = (media.data ?? []).filter((f) => f.content_type.startsWith("image/"));
  return (
    <div className="flex flex-col gap-3">
      <UploadZone onUploaded={(f) => f.content_type.startsWith("image/") && onPick(f.url, f.alt_text ?? "")} />
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {images.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                aria-label={`Use ${f.original_name}`}
                onClick={() => onPick(f.url, f.alt_text ?? "")}
                className="block aspect-square w-full overflow-hidden rounded-md border border-border hover:border-brand-green focus-visible:shadow-glow focus-visible:outline-none"
              >
                <Thumb f={f} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="ghost" size="sm" asChild>
        <a href="/cms/media" target="_blank" rel="noreferrer">
          See all files
        </a>
      </Button>
    </div>
  );
}
