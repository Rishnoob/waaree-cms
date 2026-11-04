"use client";

import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { AlignCenter, AlignLeft, AlignRight, Bold, Check, Heading2, Heading3, Highlighter, Italic, Link as LinkIcon, List, ListOrdered, Pilcrow, RemoveFormatting, Strikethrough, Underline, Unlink, X } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

/* ── Safe HTML ────────────────────────────────────────────────────────────────
 * Rich text is stored as HTML. Whatever the source (the editor, a pasted Word document, an old
 * plain-text field), it is cleaned to a short list of tags before it is shown: no scripts, no
 * styles except text alignment, and only safe link targets. */
const ALLOWED = new Set(["B", "STRONG", "I", "EM", "U", "S", "MARK", "A", "UL", "OL", "LI", "P", "BR", "H2", "H3", "BLOCKQUOTE"]);
const ALIGNABLE = new Set(["P", "H2", "H3"]);
const RENAME: Record<string, string> = { DIV: "P", H1: "H2", H4: "H3", H5: "H3", H6: "H3", STRIKE: "S", DEL: "S" };
export const safeHref = (h: string) => (/^(https?:|mailto:|tel:|\/|#)/i.test(h.trim()) ? h.trim() : "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function cleanHtml(html: string): string {
  if (typeof DOMParser === "undefined") return esc(html.replace(/<[^>]*>/g, " ")); // server: plain text only
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const walk = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return esc(n.textContent ?? "");
    if (n.nodeType !== Node.ELEMENT_NODE) return "";
    const el = n as Element;
    const inner = Array.from(el.childNodes).map(walk).join("");
    const tagName = RENAME[el.tagName] ?? el.tagName;
    if (!ALLOWED.has(tagName)) return inner;
    const tag = tagName.toLowerCase();
    if (tag === "br") return "<br>";
    if (tag === "a") {
      const href = safeHref(el.getAttribute("href") ?? "");
      return href ? `<a href="${esc(href)}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>` : inner;
    }
    const align = ALIGNABLE.has(tagName) ? (el as HTMLElement).style?.textAlign : "";
    const style = align && ["center", "right", "justify"].includes(align) ? ` style="text-align: ${align}"` : "";
    return `<${tag}${style}>${inner}</${tag}>`;
  };
  return Array.from(doc.body.firstChild!.childNodes).map(walk).join("");
}

/** Fields that were plain text before rich text existed are shown as text with line breaks. */
export const toHtml = (v: string | undefined) => (!v ? "" : /^\s*</.test(v) ? v : esc(v).replace(/\n/g, "<br>"));
export const isEmptyHtml = (html: string) => !html.replace(/<[^>]*>/g, "").trim();

export const richClasses =
  "[&_a]:font-medium [&_a]:text-primary-strong [&_a]:underline [&_a]:underline-offset-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li>p]:my-0 [&_p+p]:mt-4 [&_b]:font-semibold [&_strong]:font-semibold [&_mark]:rounded-sm [&_mark]:bg-[#fff2a8] [&_mark]:px-0.5 [&_mark]:text-inherit [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-light [&_h2]:text-foreground [&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-foreground [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-green [&_blockquote]:pl-4 [&_blockquote]:italic";

/** Rich text on the website (and in the editor until you click into it). */
export function RenderRich({ html, className }: { html: string; className?: string }) {
  return <div className={cn(richClasses, className)} dangerouslySetInnerHTML={{ __html: cleanHtml(toHtml(html)) }} />;
}

const editable =
  "cursor-text rounded-sm outline-none transition-[background-color,box-shadow] hover:bg-brand-green/[0.07] focus-within:bg-white/80 focus-within:shadow-[0_0_0_2px_rgb(13_176_43/0.45)] focus:bg-white/80 focus:shadow-[0_0_0_2px_rgb(13_176_43/0.45)]";

/**
 * Rich text, edited in place with Tiptap. It is plain HTML until you click into it; only then does
 * the editor start (so a page with many text fields stays fast), with the cursor where you clicked.
 * Select text for the formatting bar: bold, italic, underline, strike, highlight, link, headings,
 * lists, alignment, clear. Keyboard shortcuts work too (Ctrl B, Ctrl I, Ctrl K…).
 */
export function RichField({ html, onChange, className, placeholder = "Start typing…", headings = true }: { html: string; onChange: (html: string) => void; className?: string; placeholder?: string; headings?: boolean }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const value = toHtml(html);
  if (!at)
    return (
      <div
        role="textbox"
        tabIndex={0}
        aria-label={placeholder}
        aria-multiline
        data-placeholder={placeholder}
        onMouseDown={(e) => setAt({ x: e.clientX, y: e.clientY })}
        onFocus={(e) => !at && e.currentTarget.matches(":focus-visible") && setAt({ x: -1, y: -1 })}
        className={cn(className, richClasses, editable, "min-h-8", isEmptyHtml(value) && "before:text-placeholder before:content-[attr(data-placeholder)]")}
        dangerouslySetInnerHTML={isEmptyHtml(value) ? undefined : { __html: cleanHtml(value) }}
      />
    );
  return <TiptapField html={value} onChange={onChange} className={className} placeholder={placeholder} headings={headings} at={at} onDone={() => setAt(null)} />;
}

function TiptapField({ html, onChange, className, placeholder, headings, at, onDone }: { html: string; onChange: (html: string) => void; className?: string; placeholder: string; headings: boolean; at: { x: number; y: number }; onDone: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: headings ? { levels: [2, 3] } : false, code: false, codeBlock: false, horizontalRule: false, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
    ],
    content: cleanHtml(html),
    editorProps: { attributes: { class: cn("outline-none", richClasses), role: "textbox", "aria-multiline": "true", "aria-label": placeholder } },
    onCreate: ({ editor: ed }) => {
      // put the cursor where you clicked (or at the end, when you tabbed in)
      const pos = at.x >= 0 ? ed.view.posAtCoords({ left: at.x, top: at.y }) : null;
      if (pos) ed.chain().focus().setTextSelection(pos.pos).run();
      else ed.commands.focus("end");
    },
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? "" : cleanHtml(ed.getHTML())),
  });

  return (
    <div
      ref={wrap}
      className={cn(className, editable, "relative min-h-8 [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-placeholder [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]")}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        // stay open while you use the formatting bar or its link box
        if (next && (wrap.current?.contains(next) || (next as Element).closest?.("[data-rich-toolbar]"))) return;
        onDone();
      }}
    >
      {editor && <Toolbar editor={editor} headings={headings} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({ label, on, icon: Icon, run }: { label: string; on?: boolean; icon: typeof Bold; run: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      title={label}
      onMouseDown={(e) => {
        e.preventDefault(); // keep the selection
        run();
      }}
      className={cn("flex size-8 items-center justify-center rounded-md transition-colors", on ? "bg-brand-green/15 text-primary-strong" : "text-foreground hover:bg-foreground/[0.06]")}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

function Toolbar({ editor, headings }: { editor: Editor; headings: boolean }) {
  const [linking, setLinking] = useState<string | null>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      highlight: e.isActive("highlight"),
      link: e.isActive("link"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
    }),
  });
  const c = () => editor.chain().focus();
  const sep = <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;

  return (
    <BubbleMenu editor={editor} options={{ placement: "top", offset: 8 }}>
      <div data-rich-toolbar role="toolbar" aria-label="Text formatting" className="flex animate-pop-in items-center rounded-lg border border-border bg-white p-1 shadow-lg">
        {linking !== null ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const href = safeHref(linking) || (linking.includes(".") ? `https://${linking}` : "");
              if (href) c().extendMarkRange("link").setLink({ href }).run();
              setLinking(null);
            }}
          >
            <input autoFocus aria-label="Link to" value={linking} onChange={(e) => setLinking(e.target.value)} placeholder="/careers or https://…" className="h-8 w-60 rounded-md border border-border px-2 text-sm outline-none focus:border-brand-green" />
            <button type="submit" aria-label="Apply link" className="flex size-8 items-center justify-center rounded-md bg-primary text-white">
              <Check aria-hidden className="size-4" />
            </button>
            <button type="button" aria-label="Cancel link" onClick={() => setLinking(null)} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-foreground/[0.06]">
              <X aria-hidden className="size-4" />
            </button>
          </form>
        ) : (
          <>
            {headings && (
              <>
                <Btn label="Text" icon={Pilcrow} on={!s.h2 && !s.h3} run={() => c().setParagraph().run()} />
                <Btn label="Heading" icon={Heading2} on={s.h2} run={() => c().toggleHeading({ level: 2 }).run()} />
                <Btn label="Small heading" icon={Heading3} on={s.h3} run={() => c().toggleHeading({ level: 3 }).run()} />
                {sep}
              </>
            )}
            <Btn label="Bold" icon={Bold} on={s.bold} run={() => c().toggleBold().run()} />
            <Btn label="Italic" icon={Italic} on={s.italic} run={() => c().toggleItalic().run()} />
            <Btn label="Underline" icon={Underline} on={s.underline} run={() => c().toggleUnderline().run()} />
            <Btn label="Strikethrough" icon={Strikethrough} on={s.strike} run={() => c().toggleStrike().run()} />
            <Btn label="Highlight" icon={Highlighter} on={s.highlight} run={() => c().toggleHighlight().run()} />
            {s.link ? <Btn label="Remove link" icon={Unlink} on run={() => c().extendMarkRange("link").unsetLink().run()} /> : <Btn label="Link" icon={LinkIcon} run={() => setLinking(editor.getAttributes("link").href ?? "")} />}
            {sep}
            <Btn label="Bulleted list" icon={List} on={s.bullet} run={() => c().toggleBulletList().run()} />
            <Btn label="Numbered list" icon={ListOrdered} on={s.ordered} run={() => c().toggleOrderedList().run()} />
            {sep}
            <Btn label="Align left" icon={AlignLeft} on={!s.center && !s.right} run={() => c().setTextAlign("left").run()} />
            <Btn label="Align centre" icon={AlignCenter} on={s.center} run={() => c().setTextAlign("center").run()} />
            <Btn label="Align right" icon={AlignRight} on={s.right} run={() => c().setTextAlign("right").run()} />
            {sep}
            <Btn label="Clear formatting" icon={RemoveFormatting} run={() => c().unsetAllMarks().clearNodes().run()} />
          </>
        )}
      </div>
    </BubbleMenu>
  );
}

/** A rich text spot in a block: the Tiptap field while editing, clean HTML on the website. */
export function RichSlot({ value, onChange, className, placeholder, headings = false }: { value: string | undefined; onChange?: (html: string) => void; className?: string; placeholder?: string; headings?: boolean }) {
  return onChange ? <RichField html={value ?? ""} onChange={onChange} className={className} placeholder={placeholder} headings={headings} /> : <RenderRich html={value ?? ""} className={className} />;
}
