/**
 * The Story of Waaree, in five acts and their chapters, in page order. One list drives the chapter
 * numbers in every header, the story bar at the top and the side rail, so the page always tells
 * you where you are (e.g. “Act I · Who we are — 03 How it’s made”).
 */
export const ACTS = [
  { id: "who", label: "Who we are" },
  { id: "journey", label: "Our journey" },
  { id: "progress", label: "Progress" },
  { id: "next", label: "Where it’s going" },
  { id: "why", label: "Why it matters" },
] as const;

export type ActId = (typeof ACTS)[number]["id"];

export const CHAPTERS: { id: string; label: string; act: ActId }[] = [
  { id: "story", label: "Our world", act: "who" },
  { id: "inside", label: "Inside the panel", act: "who" },
  { id: "journey", label: "How it’s made", act: "who" },
  { id: "factories", label: "Factories", act: "who" },
  { id: "who-we-are", label: "Who we are", act: "who" },
  { id: "legacy", label: "Our story", act: "journey" },
  { id: "manufacturing", label: "Films", act: "journey" },
  { id: "waaree-now", label: "Waaree now", act: "progress" },
  { id: "growth", label: "Growth", act: "progress" },
  { id: "whats-next", label: "What’s next", act: "next" },
  { id: "impact", label: "Impact", act: "why" },
  { id: "community", label: "Giving back", act: "why" },
  { id: "contact", label: "Let’s go green", act: "why" },
];

/** “03” for the third chapter. */
export const chapterNumber = (id: string) => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i < 0 ? "" : String(i + 1).padStart(2, "0");
};

/** “Act II” for a chapter’s act. */
export const actOf = (id: string) => {
  const c = CHAPTERS.find((x) => x.id === id);
  const i = ACTS.findIndex((a) => a.id === c?.act);
  return i < 0 ? null : { ...ACTS[i]!, n: ["I", "II", "III", "IV", "V"][i]! };
};
