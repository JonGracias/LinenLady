// src/lib/images.ts
//
// Cloudflare Image Transformations helpers.
//
// Usage:
//   cfImage(sourceUrl, { width: 480 })
//   cfSrcSet(sourceUrl, [200, 320, 480, 640])
//
// The zone hosting transformations is configured via NEXT_PUBLIC_CF_IMAGE_ZONE
// and must be a Cloudflare-proxied (orange-cloud) hostname with Image
// Transformations enabled, and the source URL's host must be in that zone's
// allowed origins list.

const CF_ZONE =
  process.env.NEXT_PUBLIC_CF_IMAGE_ZONE ?? "img.linenlady.net";

export type CfFit =
  | "scale-down"
  | "contain"
  | "cover"
  | "crop"
  | "pad";

export type CfFormat = "auto" | "webp" | "avif" | "json";

export interface CfImageOptions {
  width?: number;
  height?: number;
  quality?: number; // 1–100
  format?: CfFormat;
  fit?: CfFit;
}

// Defaults chosen to keep transformation-count low: one quality value, format=auto,
// and a single fit mode across the app. Diverging from these creates more unique
// transformations and burns through the monthly free tier faster.
const DEFAULTS: Required<Pick<CfImageOptions, "quality" | "format" | "fit">> = {
  quality: 82,
  format: "auto",
  fit: "cover",
};

/**
 * Build a Cloudflare Image Transformation URL for a single variant.
 * Returns the source URL unchanged if it's empty or already a transform URL
 * (defensive against double-wrapping during incremental refactors).
 */
export function cfImage(sourceUrl: string, opts: CfImageOptions = {}): string {
  if (!sourceUrl) return "";
  if (sourceUrl.includes("/cdn-cgi/image/")) return sourceUrl;

  const merged = { ...DEFAULTS, ...opts };
  const params = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");

  return `https://${CF_ZONE}/cdn-cgi/image/${params}/${sourceUrl}`;
}

/**
 * Build a srcSet string for responsive <img> tags.
 *   <img srcSet={cfSrcSet(url, [320, 480, 640])} sizes="..." />
 */
export function cfSrcSet(
  sourceUrl: string,
  widths: readonly number[],
  opts: Omit<CfImageOptions, "width"> = {}
): string {
  if (!sourceUrl) return "";
  return widths
    .map((w) => `${cfImage(sourceUrl, { ...opts, width: w })} ${w}w`)
    .join(", ");
}

// Standard width ladders. Use these instead of declaring widths inline at each
// call site — every distinct ladder multiplies the transformation count.
export const WIDTHS = {
  hero: [640, 960, 1280, 1600, 1920, 2560],
  card: [200, 320, 480, 640],
  detail: [480, 800, 1200, 1600],
  portrait: [320, 480, 640, 960],
} as const;

// Standard `sizes` attributes paired with the ladders above. The `sizes` value
// must describe the rendered width of the image at each viewport — get it
// wrong and the browser picks a poorly-sized variant.
export const SIZES = {
  hero: "100vw",
  cardDesktop:
    "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  detail:
    "(min-width: 1024px) 50vw, 100vw",
  portrait:
    "(min-width: 1024px) 25vw, 50vw",
} as const;