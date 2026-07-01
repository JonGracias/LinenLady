import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noemithelinenlady.net";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    // Intentionally excluded (not useful/allowed to index):
    // /basket, /account, /sign-in, /sign-up — auth/session-specific, already disallowed in robots.ts
    // /welcome, /unauthorized — internal/transitional pages, not meant for search
  ];

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/items`;
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable body>");
      console.error(
        `[sitemap] /api/items returned ${res.status} ${res.statusText}. URL: ${apiUrl}. Body: ${body.slice(0, 500)}`
      );
      return staticPages;
    }

    const items = await res.json();
    const products: MetadataRoute.Sitemap = items.map((i: any) => ({
      url: `${baseUrl}/shop/${i.sku}`,
      lastModified: i.updatedAt ? new Date(i.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    console.log(`[sitemap] Successfully fetched ${products.length} products from ${apiUrl}`);
    return [...staticPages, ...products];
  } catch (err) {
    console.error(
      `[sitemap] Fetch threw an exception. URL attempted: ${process.env.NEXT_PUBLIC_API_URL}/api/items. Error:`,
      err
    );
    return staticPages; // never let the sitemap 500
  }
}