/**
 * Waaree films, all from Waaree’s official YouTube channel (WAAREE Energies Limited,
 * @WaareeEnergiesLtdOfficial), checked by oEmbed (title, author) and embeddable. Shown as light
 * thumbnails; a player loads only when one is opened. `start` skips long livestream intros.
 */
export type Film = { id: string; title: string; kind: string; length: string; date: string; start?: number; project?: string };

export const FILMS: Film[] = [
  { id: "jCZ0LNS3p5s", title: "Accelerating Global Energy Transition", kind: "Brand film", length: "4:51", date: "Jun 2026" },
  { id: "o5khDD6hl1o", title: "Waaree now in the USA", kind: "Texas plant", length: "4:24", date: "Jun 2026", project: "texas" },
  { id: "BQBpUDeRLBI", title: "12–15% more power with TOPCon", kind: "Inside the module", length: "1:11", date: "Jun 2026" },
  { id: "YjZ0C5VIW0U", title: "Engineering the impossible: 980 MW", kind: "EPC project", length: "3:00", date: "Sep 2025", project: "epc" },
  { id: "kCzoKpv_IVE", title: "India’s largest module testing lab", kind: "Quality", length: "6:18", date: "Feb 2025" },
  { id: "s1sSdCSF3pA", title: "India’s largest solar cell plant opens", kind: "Chikhli cell plant", length: "Live", date: "Mar 2025", start: 600, project: "chikhli-cell" },
  { id: "NOTcWy1MmNo", title: "Breaking ground on 10 GW in Nagpur", kind: "Ingot–wafer plant", length: "Live", date: "Mar 2026", start: 300, project: "nagpur" },
  { id: "pOB0Ill67G4", title: "Waaree green hydrogen", kind: "Electrolysers", length: "4:27", date: "May 2026", project: "dungri" },
  { id: "s2kOkuo_M4w", title: "The 350 kW solar inverter", kind: "Inverters", length: "1:08", date: "Aug 2026", project: "sarodhi" },
  { id: "WWedZum7-4U", title: "Flexible modules on a warehouse roof", kind: "Installation", length: "2:26", date: "Sep 2025" },
  { id: "kIqt60TrIG0", title: "Energy storage, from the leaders", kind: "Battery storage", length: "12:28", date: "Aug 2026", project: "rola" },
  { id: "8j5UjGZmtwA", title: "37 years of shared dreams", kind: "Anniversary", length: "0:48", date: "Oct 2026" },
  { id: "S2siIbpsG2M", title: "The day Waaree listed", kind: "IPO", length: "0:45", date: "Oct 2024" },
  { id: "bwgumgSsQyg", title: "Hitesh Doshi in conversation", kind: "Leadership", length: "44:56", date: "Aug 2026" },
];

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const embed = (f: Film) => `https://www.youtube-nocookie.com/embed/${f.id}?autoplay=1&rel=0${f.start ? `&start=${f.start}` : ""}`;
export const filmFor = (projectId: string) => FILMS.find((f) => f.project === projectId);
