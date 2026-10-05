import { config } from "./config.js";
import type { EtsyListing, DigitalFileGroup } from "./types.js";

export function makeDigitalTitle(sourceTitle: string): string {
  let title=sourceTitle.trim().replace(/\bphysical\s+print\b/gi,"").replace(/\bprinted\s+poster\b/gi,"poster").replace(/\s{2,}/g," ").trim();
  if(!/digital\s+download/i.test(title)) title+=config.digitalTitleSuffix;
  if(title.length>140) title=title.slice(0,140).replace(/[|,\s]+$/g,"");
  return title;
}
export function makeDigitalDescription(source:EtsyListing,group:DigitalFileGroup):string{
  const original=(source.description||"").trim();
  const fileLines=group.files.map(f=>`- ${f.split(/[\\/]/).pop()}`).join("\n");
  const formatsText=group.files.length>1?`This download contains ${group.files.length} high-resolution printable files, including the available portrait/landscape or size variants listed below.`:"This download contains one high-resolution printable artwork file.";
  return `DIGITAL DOWNLOAD — NO PHYSICAL ITEM WILL BE SHIPPED\n\n${formatsText}\n\nFiles included:\n${fileLines}\n\nPrint at home, at a local print shop, or through an online printing service. Colors may vary slightly depending on monitor, printer, paper and print settings.\n\n${original}\n\nPlease note: This listing is for a digital download only. Frame and physical print are not included.`;
}
