"use client";

import { cleanHtml } from "./rich";
import type { Block } from "./types";

/**
 * Turning files into page content, the way paid CMSs do:
 * - Excel (.xlsx) or CSV → a Table; cells copied from Excel can also be pasted straight in.
 * - Word (.docx) → headings, paragraphs, tables and pictures (pictures go to the media library).
 * - Pictures → Picture sections; PDFs → a Downloads list; videos → Video sections.
 * The heavy readers (Excel, Word) load only when such a file is used.
 */

export type Uploaded = { url: string; original_name: string; content_type: string };
export type Upload = (file: File) => Promise<Uploaded>;
type NewBlock = Omit<Block, "id">;

const MAX_ROWS = 200;
const MAX_COLS = 12;

const kind = (f: File) => {
  const n = f.name.toLowerCase();
  if (n.endsWith(".csv") || f.type === "text/csv") return "csv";
  if (n.endsWith(".xlsx")) return "xlsx";
  if (n.endsWith(".xls")) return "xls";
  if (n.endsWith(".docx")) return "docx";
  if (f.type.startsWith("image/")) return "image";
  if (f.type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (f.type.startsWith("video/")) return "video";
  return "other";
};

/** What dropping this file will make, in words (for the drop overlay and messages). */
export const ACCEPTED = "Excel or CSV → table · Word → text · pictures · PDFs → downloads · videos";
export const TABLE_FILES = ".xlsx,.csv";

const cell = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toLocaleDateString("en-IN") : String(v).trim());

/** Square up rows (same number of columns), drop empty rows and columns, and cap the size. */
function tidy(rows: unknown[][]): { rows: string[][]; cut: boolean } {
  let t = rows.map((r) => r.map(cell)).filter((r) => r.some(Boolean));
  const width = Math.max(0, ...t.map((r) => r.length));
  t = t.map((r) => [...r, ...Array(width - r.length).fill("")]);
  const used = Array.from({ length: width }, (_, c) => t.some((r) => r[c])); // drop empty columns
  t = t.map((r) => r.filter((_, c) => used[c]));
  const cut = t.length > MAX_ROWS || (t[0]?.length ?? 0) > MAX_COLS;
  return { rows: t.slice(0, MAX_ROWS).map((r) => r.slice(0, MAX_COLS)), cut };
}

/** An .xlsx or .csv file → table rows (first sheet with data). */
export async function readTable(file: File): Promise<{ rows: string[][]; cut: boolean; sheet?: string }> {
  const k = kind(file);
  if (k === "csv") {
    const Papa = (await import("papaparse")).default;
    const parsed = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true });
    return tidy(parsed.data);
  }
  if (k === "xlsx") {
    const readXlsxFile = (await import("read-excel-file/browser")).default;
    const sheets = await readXlsxFile(file);
    const first = sheets.find((s) => s.data.some((r) => r.some((c) => c != null && String(c).trim()))) ?? sheets[0];
    return { ...tidy((first?.data ?? []) as unknown[][]), sheet: sheets.length > 1 ? first?.sheet : undefined };
  }
  if (k === "xls") throw new Error("Old .xls files can’t be read. In Excel, choose File › Save As › .xlsx, then try again.");
  throw new Error("Use an Excel (.xlsx) or CSV file.");
}

/** Cells copied from Excel or Google Sheets arrive as tab-separated lines. */
export const rowsFromPaste = (text: string): string[][] | null => {
  if (!text.includes("\t") && !/\n.+/.test(text.trim())) return null; // a single value: let it paste normally
  return tidy(
    text
      .replace(/\r/g, "")
      .replace(/\n$/, "")
      .split("\n")
      .map((l) => l.split("\t")),
  ).rows;
};

const tableBlock = (rows: string[][], caption = ""): NewBlock => ({ type: "table", visible: true, props: { rows: JSON.stringify(rows), header: "yes", caption } });

/** A Word document → sections: headings, paragraphs (kept together), tables and pictures. */
async function blocksFromDocx(file: File, upload: Upload): Promise<NewBlock[]> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      convertImage: mammoth.images.imgElement(async (img) => {
        const bytes = await img.readAsArrayBuffer();
        const ext = img.contentType.split("/")[1] ?? "png";
        const up = await upload(new File([bytes], `${file.name.replace(/\.docx$/i, "")}-image.${ext}`, { type: img.contentType }));
        return { src: up.url };
      }),
    },
  );
  const doc = new DOMParser().parseFromString(`<div>${result.value}</div>`, "text/html");
  const out: NewBlock[] = [];
  let para = "";
  const flush = () => {
    const clean = cleanHtml(para).trim();
    if (clean.replace(/<[^>]*>/g, "").trim()) out.push({ type: "text", visible: true, props: { html: clean } });
    para = "";
  };
  for (const el of Array.from(doc.body.firstElementChild!.children)) {
    const tag = el.tagName;
    const img = el.querySelector("img");
    if (/^H[1-6]$/.test(tag)) {
      flush();
      const text = el.textContent?.trim();
      if (text) out.push({ type: "heading", visible: true, props: { text, size: tag === "H1" ? "large" : tag === "H2" ? "medium" : "small" } });
    } else if (tag === "TABLE") {
      flush();
      const rows = Array.from(el.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("td,th")).map((c) => c.textContent ?? ""));
      const t = tidy(rows);
      if (t.rows.length) out.push(tableBlock(t.rows));
    } else if (img && !el.textContent?.trim()) {
      flush();
      out.push({ type: "image", visible: true, props: { src: img.getAttribute("src") ?? "", caption: img.getAttribute("alt") ?? "", shape: "wide" } });
    } else {
      para += el.outerHTML;
    }
  }
  flush();
  if (!out.length) throw new Error(`“${file.name}” has no text we could use.`);
  return out;
}

/**
 * Files dropped on the page → new sections. Pictures, PDFs and videos are uploaded to the media
 * library first. Several PDFs together become one Downloads list.
 */
export async function blocksFromFiles(files: File[], upload: Upload): Promise<{ blocks: NewBlock[]; notes: string[] }> {
  const blocks: NewBlock[] = [];
  const notes: string[] = [];
  const docs: { title: string; url: string; kind: "pdf" | "video" | "file"; year: string; isNew: boolean }[] = [];
  for (const f of files) {
    const k = kind(f);
    try {
      if (k === "csv" || k === "xlsx" || k === "xls") {
        const t = await readTable(f);
        if (!t.rows.length) throw new Error(`“${f.name}” is empty.`);
        blocks.push(tableBlock(t.rows));
        if (t.cut) notes.push(`“${f.name}” was large; the first ${MAX_ROWS} rows and ${MAX_COLS} columns were used.`);
        if (t.sheet) notes.push(`Used the sheet “${t.sheet}” from “${f.name}”.`);
      } else if (k === "docx") {
        blocks.push(...(await blocksFromDocx(f, upload)));
      } else if (k === "image") {
        const up = await upload(f);
        blocks.push({ type: "image", visible: true, props: { src: up.url, caption: "", shape: "wide" } });
      } else if (k === "video") {
        const up = await upload(f);
        blocks.push({ type: "video", visible: true, props: { url: up.url, caption: "" } });
      } else if (k === "pdf") {
        const up = await upload(f);
        docs.push({ title: f.name.replace(/\.pdf$/i, ""), url: up.url, kind: "pdf", year: String(new Date().getFullYear()), isNew: true });
      } else {
        notes.push(`“${f.name}” isn’t a file type that can become a section.`);
      }
    } catch (e) {
      notes.push((e as Error).message);
    }
  }
  if (docs.length) blocks.push({ type: "documents", visible: true, props: { title: "Downloads", items: JSON.stringify(docs) } });
  return { blocks, notes };
}
