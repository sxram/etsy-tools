import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { API_BASE, config } from "./config.js";
import { loadToken, saveToken } from "./token-store.js";
import type { EtsyListing, EtsyListingImage, EtsyShop, EtsyToken } from "./types.js";

function xApiKey() { return `${config.apiKey}:${config.sharedSecret}`; }

async function refreshToken(token: EtsyToken): Promise<EtsyToken> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.apiKey,
    refresh_token: token.refresh_token,
  });
  const res = await fetch(`${API_BASE}/public/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed ${res.status}: ${await res.text()}`);
  const fresh = await res.json() as Omit<EtsyToken, "obtained_at">;
  const stored: EtsyToken = { ...fresh, obtained_at: Date.now() };
  await saveToken(stored);
  return stored;
}

export async function getAccessToken(): Promise<string> {
  let token = await loadToken();
  if (!token) throw new Error("Not authenticated. Run: npm run auth");
  if (Date.now() - token.obtained_at > Math.max(0, token.expires_in - 120) * 1000) token = await refreshToken(token);
  return token.access_token;
}

export async function etsyFetch<T>(path: string, init: RequestInit = {}, requireAuth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-api-key", xApiKey());
  if (requireAuth) headers.set("Authorization", `Bearer ${await getAccessToken()}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`Etsy ${res.status} ${res.statusText}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return await res.json() as T;
}

export async function getMyUserId(): Promise<number> {
  const accessToken = await getAccessToken();
  const id = Number(accessToken.split(".")[0]);
  if (!Number.isFinite(id) || id <= 0) throw new Error("Could not determine Etsy user id from access token.");
  return id;
}

export async function getMyShop(): Promise<EtsyShop> {
  const userId = await getMyUserId();
  return etsyFetch<EtsyShop>(`/application/users/${userId}/shops`);
}

type PagedListings = { count: number; results: EtsyListing[] };
export async function getAllShopListings(shopId: number, state: "active" | "inactive" | "sold_out" | "draft" | "expired" = "active"): Promise<EtsyListing[]> {
  const all: EtsyListing[] = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const q = new URLSearchParams({ state, limit: String(limit), offset: String(offset), sort_on: "created", sort_order: "desc" });
    const page = await etsyFetch<PagedListings>(`/application/shops/${shopId}/listings?${q.toString()}`);
    all.push(...page.results);
    if (page.results.length < limit || all.length >= page.count) break;
    offset += limit;
  }
  return all;
}

export async function getListing(listingId: number): Promise<EtsyListing> {
  return etsyFetch<EtsyListing>(`/application/listings/${listingId}?includes=Images`);
}

export async function getListingImages(shopId: number, listingId: number): Promise<EtsyListingImage[]> {
  const result = await etsyFetch<{ count: number; results: EtsyListingImage[] }>(`/application/shops/${shopId}/listings/${listingId}/images`);
  return result.results;
}

export async function createDigitalDraft(input: {shopId:number; source:EtsyListing; imageIds:number[]; title:string; description:string; price?:number;}): Promise<EtsyListing> {
  const src = input.source;
  if (!src.taxonomy_id) throw new Error("Source listing has no taxonomy_id.");
  if (!src.who_made) throw new Error("Source listing has no who_made value.");
  if (!src.when_made) throw new Error("Source listing has no when_made value.");
  const body = new URLSearchParams();
  body.set("quantity", "999");
  body.set("title", input.title);
  body.set("description", input.description);
  body.set("price", (input.price ?? config.digitalPrice).toFixed(2));
  body.set("who_made", src.who_made);
  body.set("when_made", src.when_made);
  body.set("taxonomy_id", String(src.taxonomy_id));
  body.set("type", "download");
  if (input.imageIds.length) body.set("image_ids", input.imageIds.join(","));
  if ((src.tags || []).length) body.set("tags", (src.tags || []).slice(0, 13).join(","));
  return etsyFetch<EtsyListing>(`/application/shops/${input.shopId}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

export async function uploadDigitalFile(shopId: number, listingId: number, filePath: string): Promise<unknown> {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([bytes]), basename(filePath));
  return etsyFetch(`/application/shops/${shopId}/listings/${listingId}/files`, { method: "POST", body: form });
}
