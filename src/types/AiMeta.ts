// src/types/AiMeta.ts

export type AiMeta = {
  keywordsJson: string | null;
  keywordsGeneratedAt: string | null;
  seoJson: string | null;
  seoGeneratedAt: string | null;
};

export type SeoData = {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  jsonLd: Record<string, unknown>;
};

export type KeywordsMap = Record<string, string[]>;
export type AiField = "title" | "description" | "price" | "keywords";

export type MetaProps = {
  inventoryId: number;
  itemName: string;
  itemDescription: string;
  itemPriceCents: number;
  onItemUpdated: (fields: { name: string; description: string; priceCents: number }) => void;
};
