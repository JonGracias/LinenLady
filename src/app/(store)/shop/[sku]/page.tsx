import type { Metadata } from "next";
import type { ItemDetail, InventoryImage } from "@/types/inventory";
import ItemDetailClient from "./ItemDetailClient";

const API  = process.env.LINENLADY_API_BASE_URL!;        // absolute App Service URL — see note below
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noemithelinenlady.net";

async function getItem(sku: string): Promise<ItemDetail | null> {
  try {
    const res = await fetch(`${API}/api/items/sku/${sku}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getPrimaryImageUrl(inventoryId: number): Promise<string | null> {
  try {
    const res = await fetch(`${API}/api/items/${inventoryId}/images`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const imgs: InventoryImage[] = await res.json();
    const primary = imgs.find((i) => i.isPrimary) ?? imgs[0];
    return primary?.readUrl ?? null;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ sku: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sku } = await params;
  const item = await getItem(sku);
  if (!item) return { title: "Piece Not Found", robots: { index: false } };

  const image = await getPrimaryImageUrl(item.inventoryId);
  const description =
    item.description?.slice(0, 160) ??
    "A one-of-a-kind heritage piece from The Linen Lady's curated collection of antique linens.";

  return {
    title: item.name,
    description,
    alternates: { canonical: `/shop/${item.sku}` },
    openGraph: {
      title: item.name,
      description,
      url: `/shop/${item.sku}`,
      images: image ? [image] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function Page({ params }: Props) {
  const { sku } = await params;
  const item = await getItem(sku); // deduped — Next caches the identical fetch from generateMetadata

  const jsonLd = item
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.name,
        description: item.description ?? undefined,
        sku: item.sku,
        image: (await getPrimaryImageUrl(item.inventoryId)) ?? undefined,
        offers: {
          "@type": "Offer",
          url: `${SITE}/shop/${item.sku}`,
          priceCurrency: "USD",
          price: (item.unitPriceCents / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/UsedCondition",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ItemDetailClient />
    </>
  );
}