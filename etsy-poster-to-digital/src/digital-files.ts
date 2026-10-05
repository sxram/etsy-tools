import { readdir } from "node:fs/promises";
import { extname, join, basename } from "node:path";
import type { DigitalFileGroup } from "./types.js";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".pdf", ".zip"]);

export function baseNameForGrouping(fileName: string): string {
  const ext = extname(fileName);
  let stem = basename(fileName, ext);
  stem = stem.replace(/[_\-\s]+300\s*dpi$/i, "");
  stem = stem.replace(/[_\-\s]+\d+(?:[.,]\d+)?x\d+(?:[.,]\d+)?\s*(?:cm|mm|in|inch|inches)$/i, "");
  stem = stem.replace(/[_\-\s]+\d+(?:[.,]\d+)?x\d+(?:[.,]\d+)?$/i, "");
  stem = stem.replace(/[_\-\s]+(?:portrait|vertical|hochformat|landscape|horizontal|querformat)$/i, "");
  return stem.replace(/[_\-\s]+$/g, "").trim();
}

export function normalizedKey(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9äöüß]+/gi, " ").replace(/\s+/g, " ").trim();
}

export async function scanDigitalFileGroups(dir: string): Promise<DigitalFileGroup[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const groups = new Map<string, DigitalFileGroup>();
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = extname(e.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;
    const displayName = baseNameForGrouping(e.name);
    const key = normalizedKey(displayName);
    if (!key) continue;
    const current = groups.get(key) ?? { key, displayName, files: [] };
    current.files.push(join(dir, e.name));
    groups.set(key, current);
  }
  return [...groups.values()].map(g => ({ ...g, files: g.files.sort() })).sort((a,b)=>a.displayName.localeCompare(b.displayName));
}

function words(value: string): Set<string> { return new Set(normalizedKey(value).split(" ").filter(w => w.length >= 3)); }
export function scoreGroupAgainstTitle(group: DigitalFileGroup, title: string): number {
  const a=words(group.displayName), b=words(title); if(!a.size||!b.size) return 0;
  let common=0; for(const w of a) if(b.has(w)) common++;
  return (2*common)/(a.size+b.size);
}
export function chooseBestGroup(groups: DigitalFileGroup[], listingTitle: string) {
  const ranked=groups.map(group=>({group,score:scoreGroupAgainstTitle(group,listingTitle)})).sort((a,b)=>b.score-a.score);
  if(!ranked.length) throw new Error("No digital file groups found.");
  return {group:ranked[0].group,score:ranked[0].score,secondScore:ranked[1]?.score??0};
}
