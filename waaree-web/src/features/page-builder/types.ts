import type { LucideIcon } from "lucide-react";

/** How a section looks around its content. Every block type gets these, set in its “Look” tab. */
export type BlockStyle = {
  bg?: "none" | "soft" | "tint" | "dark" | "brand";
  width?: "normal" | "narrow";
  align?: "left" | "center";
  space?: "compact" | "normal" | "roomy";
};

/**
 * One section of a page. `props` are plain strings (lists are JSON strings), so any block type can
 * be stored, copied and sent through approval the same way. Stored in the page body as
 * {"blocks": [...]}.
 */
export type Block = { id: number; type: string; visible: boolean; props: Record<string, string>; style?: BlockStyle };

export type Props = Record<string, string>;
export type Edit = (patch: Props) => void;

/**
 * A block type: everything the builder needs to know about it, in one place. Add a new type by
 * writing one of these (see blocks/) and listing it in registry.ts. Nothing else changes.
 */
export type BlockDef = {
  type: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  group: "Text" | "Media" | "Layout" | "Data" | "Actions";
  defaults: () => Props;
  defaultStyle?: BlockStyle;
  /** The section on the page. With `edit`, text can be typed in place. */
  Render: (p: { props: Props; edit?: Edit; style: BlockStyle }) => React.ReactNode;
  /** Options that can’t be typed on the page (links, pictures, rows…), shown in the side panel. */
  Options?: (p: { props: Props; onChange: Edit }) => React.ReactNode;
  /** A small drawing for galleries and template previews. */
  Sketch: () => React.ReactNode;
};
