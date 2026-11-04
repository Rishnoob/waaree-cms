import { buttons } from "./blocks/actions";
import { faq, stats, table } from "./blocks/data";
import { carousel, dataview } from "./blocks/dataview";
import { banner, cards, columns, cta, divider, spacer } from "./blocks/layout";
import { documents, image, video } from "./blocks/media";
import { heading, quote, text } from "./blocks/text";
import type { BlockDef } from "./types";

/**
 * Every block type the page builder offers, in gallery order. To add one: write its BlockDef in
 * blocks/ and list it here. The editor, the public page, the UI Kit and templates all read this.
 */
export const BLOCKS: BlockDef[] = [heading, text, quote, image, video, documents, banner, columns, cards, cta, buttons, carousel, dataview, stats, table, faq, divider, spacer];

export const GROUPS = ["Text", "Media", "Layout", "Actions", "Data"] as const;

export const blockDef = (type: string) => BLOCKS.find((b) => b.type === type);
