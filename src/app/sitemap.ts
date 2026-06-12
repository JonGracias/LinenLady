import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noemithelinenlady.net";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    // about, contact, etc.
  ];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
      next: { revalidate: 3600 },
    });
    const items = await res.json();
    const products: MetadataRoute.Sitemap = items.map((i: any) => ({
      url: `${baseUrl}/shop/${i.sku}`,
      lastModified: i.updatedAt ? new Date(i.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticPages, ...products];
  } catch {
    return staticPages; // never let the sitemap 500
  }
}