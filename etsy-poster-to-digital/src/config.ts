import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env and set it.`);
  return value;
}

export const config = {
  apiKey: required("ETSY_API_KEY"),
  sharedSecret: required("ETSY_SHARED_SECRET"),
  redirectUri: process.env.ETSY_REDIRECT_URI?.trim() || "http://localhost:3003/oauth/callback",
  scopes: (process.env.ETSY_SCOPES?.trim() || "shops_r listings_r listings_w")
    .split(/\s+/)
    .filter(Boolean),
  posterKeywords: (process.env.POSTER_KEYWORDS || "poster,wall art,nursery,print")
    .split(",")
    .map(x => x.trim().toLowerCase())
    .filter(Boolean),
  digitalPrice: Number(process.env.DIGITAL_PRICE || "4.49"),
  digitalFilesDir: process.env.DIGITAL_FILES_DIR?.trim() || "./digital",
  digitalTitleSuffix: process.env.DIGITAL_TITLE_SUFFIX ?? " | Printable Wall Art | Digital Download",
};

export const API_BASE = "https://api.etsy.com/v3";
