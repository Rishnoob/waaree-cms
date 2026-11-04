import type { Block } from "./types";

/**
 * Page templates: a starting set of sections for common Waaree pages. Choosing one fills the new
 * draft; everything stays editable. Figures shown are waaree.com’s own (see docs/research);
 * everything else is a placeholder to replace. (Plain data: also read on the server, so no client helpers here.)
 */
export type PageTemplate = { key: string; label: string; hint: string; blocks: Block[] };

const b = (id: number, type: string, props: Record<string, string>, style?: Block["style"]): Block => ({ id, type, visible: true, props, ...(style && { style }) });

export const TEMPLATES: PageTemplate[] = [
  { key: "blank", label: "Blank page", hint: "Start from nothing", blocks: [] },
  {
    key: "landing",
    label: "Landing page",
    hint: "Banner, numbers, three points and a call to action",
    blocks: [
      b(1, "banner", { title: "Powering India’s energy transition", subtitle: "Solar modules, cells and complete energy solutions, made in India.", button: "Get in touch", link: "/#contact" }, { bg: "tint" }),
      b(2, "stats", { items: "25.8 GW | Module capacity\n5.4 GW | Cell capacity\n24+ | Countries supplied" }),
      b(3, "heading", { text: "Why Waaree", size: "medium" }),
      b(4, "columns", { items: JSON.stringify([{ title: "First point", text: "" }, { title: "Second point", text: "" }, { title: "Third point", text: "" }]) }),
      b(5, "cta", { title: "Ready to go solar?", text: "Talk to our team about the right system for you.", button: "Get in touch", link: "/#contact" }, { bg: "brand" }),
    ],
  },
  {
    key: "product",
    label: "Product page",
    hint: "Banner, picture, highlights, specs table and FAQ",
    blocks: [
      b(1, "banner", { title: "Product name", subtitle: "One line on what it does best.", button: "Enquire now", link: "/#contact" }, { bg: "tint" }),
      b(2, "image", { src: "/waaree/about/module-line.webp", caption: "Made on Waaree’s automated lines", shape: "wide" }),
      b(3, "heading", { text: "Highlights", size: "medium" }),
      b(4, "columns", { items: JSON.stringify([{ title: "Highlight", text: "" }, { title: "Highlight", text: "" }, { title: "Highlight", text: "" }]) }),
      b(5, "heading", { text: "Specifications", size: "medium" }),
      b(6, "table", { rows: JSON.stringify([["Specification", "Value"], ["", ""], ["", ""], ["", ""]]), header: "yes", caption: "" }),
      b(7, "buttons", { items: JSON.stringify([{ label: "Download the datasheet", link: "", kind: "primary" }, { label: "Talk to sales", link: "/#contact", kind: "secondary" }]) }),
      b(8, "faq", { items: JSON.stringify([{ q: "", a: "" }]) }),
    ],
  },
  {
    key: "investor",
    label: "Investor update",
    hint: "Results in numbers, commentary and documents",
    blocks: [
      b(1, "banner", { title: "Quarterly results", subtitle: "Highlights for the quarter.", button: "", link: "" }, { bg: "tint" }),
      b(2, "stats", { items: "₹ — | Revenue\n₹ — | EBITDA\n— GW | Order book" }),
      b(3, "heading", { text: "Management commentary", size: "medium" }),
      b(4, "text", { html: "" }),
      b(5, "documents", { title: "Presentation and filings", items: "[]" }),
    ],
  },
  {
    key: "documents",
    label: "Reports & downloads",
    hint: "Annual reports, presentations and videos",
    blocks: [b(1, "banner", { title: "Annual reports", subtitle: "Reports, presentations and disclosures in one place.", button: "", link: "" }, { bg: "tint" }), b(2, "documents", { title: "Reports", items: "[]" })],
  },
  {
    key: "news",
    label: "News article",
    hint: "Picture, story and a quote",
    blocks: [b(1, "image", { src: "/waaree/about/facility-aerial.webp", caption: "", shape: "wide" }), b(2, "text", { html: "" }), b(3, "quote", { text: "", by: "" }, { width: "narrow" })],
  },
];
