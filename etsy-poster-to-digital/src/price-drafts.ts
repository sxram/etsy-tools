import { getAllShopListings, getMyShop, etsyFetch } from "./etsy.js";
import type { EtsyListing } from "./types.js";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getPrice(listing: EtsyListing): number | undefined {
  const p = listing.price;
  if (!p) return undefined;
  return p.amount / p.divisor;
}

function isDigitalDraft(listing: EtsyListing): boolean {
  const type = (listing.type || listing.listing_type || "").toLowerCase();
  const title = listing.title.toLowerCase();

  return (
    type === "download" ||
    title.includes("digital download") ||
    title.includes("printable wall art")
  );
}

async function updatePrice(
  shopId: number,
  listingId: number,
  price: number,
): Promise<void> {
  const body = new URLSearchParams();
  body.set("price", price.toFixed(2));

  await etsyFetch(
    `/application/shops/${shopId}/listings/${listingId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );
}

async function main() {
  const mode = process.argv[2];

  if (!["preview", "update"].includes(mode || "")) {
    throw new Error(
      "Usage:\n" +
      "  tsx src/price-drafts.ts preview --price 2.49\n" +
      "  tsx src/price-drafts.ts update --price 2.49 --confirm"
    );
  }

  const priceRaw = arg("--price") || "2.49";
  const price = Number(priceRaw.replace(",", "."));

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid --price value: ${priceRaw}`);
  }

  const shop = await getMyShop();
  const drafts = await getAllShopListings(shop.shop_id, "draft");

  const targets = drafts.filter(isDigitalDraft);

  if (!targets.length) {
    console.log("No matching digital draft listings found.");
    return;
  }

  console.table(
    targets.map(x => ({
      id: x.listing_id,
      currentPrice: getPrice(x)?.toFixed(2) ?? "?",
      newPrice: price.toFixed(2),
      title: x.title.length > 85 ? x.title.slice(0, 82) + "..." : x.title,
    })),
  );

  console.log(`\n${targets.length} digital draft(s) matched.`);

  if (mode === "preview") {
    console.log("\nPreview only. Nothing was changed.");
    return;
  }

  if (!hasFlag("--confirm")) {
    throw new Error(
      "No prices changed. Add --confirm after checking the preview."
    );
  }

  const results: Array<{
    id: number;
    title: string;
    result: string;
  }> = [];

  for (const listing of targets) {
    try {
      const oldPrice = getPrice(listing);

      if (oldPrice !== undefined && Math.abs(oldPrice - price) < 0.001) {
        results.push({
          id: listing.listing_id,
          title: listing.title,
          result: `SKIPPED: already ${price.toFixed(2)}`,
        });
        continue;
      }

      await updatePrice(shop.shop_id, listing.listing_id, price);

      results.push({
        id: listing.listing_id,
        title: listing.title,
        result: `UPDATED: ${oldPrice?.toFixed(2) ?? "?"} -> ${price.toFixed(2)}`,
      });
    } catch (err) {
      results.push({
        id: listing.listing_id,
        title: listing.title,
        result: `FAILED: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  console.log("\nPRICE UPDATE RESULT");
  console.table(
    results.map(r => ({
      id: r.id,
      title: r.title.length > 55 ? r.title.slice(0, 52) + "..." : r.title,
      result: r.result,
    })),
  );
}

main().catch(err => {
  console.error("\nERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
