// src/components/admin/SimilarItemsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useItemAi } from "@/context/ItemAiContext";

type SimilarItem = {
  InventoryId: number;
  PublicId: string;
  Name: string;
  Description: string | null;
  UnitPriceCents: number;
  IsActive: boolean;
  IsDraft: boolean;
  Score: number;
};

type Props = {
  inventoryId: number;
  top?: number;
  minScore?: number;
  publishedOnly?: boolean;
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700/50" :
    pct >= 60 ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/50" :
                "bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600/50";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono ${color}`}>
      {pct}%
    </span>
  );
}

export default function SimilarItemsPanel({
  inventoryId,
  top = 10,
  minScore = 0.85,
  publishedOnly = false,
}: Props) {
  const { keywordsGeneratedAt } = useItemAi();
  const [items, setItems]     = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/admin/api/items/${inventoryId}/similar?top=${top}&minScore=${minScore}&publishedOnly=${publishedOnly}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = await res.json() as SimilarItem[];
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load similar items.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [inventoryId, top, minScore, publishedOnly, keywordsGeneratedAt]);

  const panelCls = "mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4";
  const headingCls = "text-sm font-semibold text-gray-500 dark:text-gray-400";

  if (loading) {
    return (
      <div className={panelCls}>
        <h2 className={`mb-3 ${headingCls}`}>Similar Items</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent" />
          Finding similar items…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={panelCls}>
        <h2 className={`mb-1 ${headingCls}`}>Similar Items</h2>
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={panelCls}>
        <h2 className={`mb-1 ${headingCls}`}>Similar Items</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">No similar items found.</p>
      </div>
    );
  }

  return (
    <div className={panelCls}>
      <h2 className={`mb-3 ${headingCls}`}>
        Similar Items
        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-600">({items.length})</span>
      </h2>

      <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700/50">
        {items.map((item) => (
          <Link
            key={item.InventoryId}
            href={`/admin/drafts/${item.InventoryId}`}
            className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-gray-100 dark:hover:bg-gray-700/20"
          >
            <ScorePill score={item.Score} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors group-hover:text-gray-900 dark:group-hover:text-white">
                {item.Name}
              </p>
              {item.Description && (
                <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                  {item.Description}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 text-sm font-semibold text-gray-600 dark:text-gray-300">
              {formatMoney(item.UnitPriceCents)}
            </span>
            <svg
              className="h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}