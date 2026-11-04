import { Building2, Construction, Factory } from "lucide-react";

import type { Facility } from "../data/facilities";

/** Icon for a site’s kind. Shared by the map (client) and facility pages (server). */
export function KindIcon({ f, className }: { f: Facility; className?: string }) {
  if (f.kind === "development") return <Construction aria-hidden className={className} />;
  if (f.kind === "office") return <Building2 aria-hidden className={className} />;
  return <Factory aria-hidden className={className} />;
}

export function statusLabel(f: Facility) {
  if (f.status === "under-construction") return "Under construction";
  return f.kind === "office" ? "Office" : "Operational";
}
