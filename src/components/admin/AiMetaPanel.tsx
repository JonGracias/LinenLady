// src/components/admin/AiMetaPanel.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { ManualEditModal } from "@/components/admin/modals/ManualEditModal";
import { useItemAi } from "@/context/ItemAiContext";

/* ── Types ──────────────────────────────────────────────────────────────── */

type AiMeta = {
  keywordsJson: string | null;
  keywordsGeneratedAt: string | null;
  seoJson: string | null;
  seoGeneratedAt: string | null;
};

type SeoData = {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  jsonLd: Record<string, unknown>;
};

type KeywordsMap = Record<string, string[]>;
type AiField = "title" | "description" | "price" | "keywords";

type Props = {
  inventoryId: number;
  itemName: string;
  itemDescription: string;
  itemPriceCents: number;
  onItemUpdated: (fields: { name: string; description: string; priceCents: number }) => void;
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function parseKeywords(json: string | null): KeywordsMap | null {
  if (!json) return null;
  try { return JSON.parse(json) as KeywordsMap; }
  catch { return null; }
}

function parseSeo(json: string | null): SeoData | null {
  if (!json) return null;
  try { return JSON.parse(json) as SeoData; }
  catch { return null; }
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

const ALL_FIELDS: AiField[] = ["title", "description", "price", "keywords"];

const FIELD_LABELS: Record<AiField, string> = {
  title:       "Title",
  description: "Description",
  price:       "Price",
  keywords:    "Generate Keywords",
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function AiMetaPanel({
  inventoryId,
  itemName,
  itemDescription,
  itemPriceCents,
  onItemUpdated,
}: Props) {
  const { notifyKeywordsUpdated } = useItemAi();
  const [meta, setMeta]                 = useState<AiMeta | null>(null);
  const [loading, setLoading]           = useState(true);
  const [aiHint, setAiHint]             = useState("");
  const [activeFields, setActiveFields] = useState<Set<AiField>>(new Set(ALL_FIELDS));
  const [running, setRunning]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [statusMsg, setStatusMsg]       = useState<string | null>(null);
  const [manualOpen, setManualOpen]     = useState(false);

  /* ── Load AI meta ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/admin/api/items/${inventoryId}/ai-meta`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = await res.json() as AiMeta;
        if (!cancelled) setMeta(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [inventoryId]);

  /* ── Toggle field ── */
  const toggleField = (field: AiField) => {
    setActiveFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  /* ── Run AI ── */
  const handleRunAi = useCallback(async () => {
    if (activeFields.size === 0) return;
    setRunning(true);
    setError(null);
    setStatusMsg(null);

    try {
      const steps: string[] = [];

      const rewriteFields = (["title", "description", "price"] as AiField[])
        .filter((f) => activeFields.has(f));

      if (rewriteFields.length > 0) {
        const res = await fetch(`/admin/api/items/${inventoryId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            ai: { hint: aiHint.trim() || undefined, fields: rewriteFields },
          }),
        });
        if (res.ok) {
          const data = await res.json() as {
            name?: string; description?: string; unitPriceCents?: number;
          };
          onItemUpdated({
            name:        data.name          ?? itemName,
            description: data.description   ?? itemDescription,
            priceCents:  data.unitPriceCents ?? itemPriceCents,
          });
          steps.push(rewriteFields.map((f) => FIELD_LABELS[f]).join(", ") + " rewritten");
        }
      }

      if (activeFields.has("keywords")) {
        const kwRes = await fetch(`/admin/api/items/${inventoryId}/keywords/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hint: aiHint.trim() || undefined }),
          cache: "no-store",
        });
        if (kwRes.ok) {
          const metaRes = await fetch(`/admin/api/items/${inventoryId}/ai-meta`, { cache: "no-store" });
          if (metaRes.ok) {
            const freshMeta = await metaRes.json() as AiMeta;
            setMeta(freshMeta);
            notifyKeywordsUpdated(
              freshMeta.keywordsGeneratedAt ?? new Date().toISOString(),
              freshMeta.seoGeneratedAt
            );
          }
          steps.push("keywords & SEO updated");
        }
      }

      setStatusMsg(steps.length > 0 ? `✓ ${steps.join(" · ")}` : "Nothing changed.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI run failed.");
    } finally {
      setRunning(false);
    }
  }, [inventoryId, activeFields, aiHint, itemName, itemDescription, itemPriceCents, onItemUpdated, notifyKeywordsUpdated]);

  /* ── Render ── */
  const keywords = parseKeywords(meta?.keywordsJson ?? null);
  const seo      = parseSeo(meta?.seoJson ?? null);

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-400 dark:text-gray-500">AI</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">AI</h2>
          <button
            onClick={() => setManualOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit manually
          </button>
        </div>

        {/* ── AI hint ── */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400 dark:text-gray-500">
            AI hint
            <span className="ml-1 font-normal text-gray-400 dark:text-gray-600">
              (optional — tip: deselect Title/Description/Price and use this for private context that influences keywords only)
            </span>
          </label>
          <input
            type="text"
            value={aiHint}
            onChange={(e) => setAiHint(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleRunAi(); }}
            placeholder='e.g. "1920s French linen, excellent condition, rare monogram"'
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
          />
        </div>

        {/* ── Field toggles ── */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400 dark:text-gray-500">
            Apply to
            <span className="ml-1 font-normal text-gray-400 dark:text-gray-600">(click to deselect)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_FIELDS.map((field) => {
              const active = activeFields.has(field);
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => toggleField(field)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-purple-500 bg-purple-600 text-white"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-400",
                  ].join(" ")}
                >
                  {FIELD_LABELS[field]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Run AI + status ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-h-[1rem] text-xs">
            {statusMsg && !error && <span className="text-green-600 dark:text-green-400">{statusMsg}</span>}
            {error && <span className="text-red-500 dark:text-red-400">{error}</span>}
          </div>
          <button
            onClick={handleRunAi}
            disabled={running || activeFields.size === 0}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-purple-300 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50"
          >
            {running ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 dark:border-purple-400 border-t-transparent" />
                Running…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Run AI
              </>
            )}
          </button>
        </div>

        {/* ── Keywords display ── */}
        {keywords && Object.keys(keywords).length > 0 ? (
          <div className="border-t border-gray-200 dark:border-gray-700/50 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Generated keywords</span>
              {meta?.keywordsGeneratedAt && (
                <span className="text-xs text-gray-400 dark:text-gray-600">{formatDate(meta.keywordsGeneratedAt)}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(keywords).map(([category, values]) => {
                if (!Array.isArray(values) || values.length === 0) return null;
                return (
                  <div key={category} className="flex flex-wrap items-start gap-1.5">
                    <span className="mt-0.5 min-w-[80px] text-xs font-medium capitalize text-gray-400 dark:text-gray-500">
                      {category.replace(/_/g, " ")}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {values.map((v) => (
                        <span key={v} className="rounded-full border border-gray-200 dark:border-gray-600/50 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-700/50 pt-4">
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                No keywords yet — run AI with "Generate Keywords" selected.
              </p>
            </div>
          </div>
        )}

        {/* ── SEO preview ── */}
        {seo ? (
          <div className="border-t border-gray-200 dark:border-gray-700/50 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">SEO preview</span>
              {meta?.seoGeneratedAt && (
                <span className="text-xs text-gray-400 dark:text-gray-600">{formatDate(meta.seoGeneratedAt)}</span>
              )}
            </div>
            {/* Google SERP card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 p-3">
              <p className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">{seo.title}</p>
              <p className="mt-0.5 truncate text-xs text-green-700 dark:text-green-600">linenlady.net › items › …</p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{seo.metaDescription}</p>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex gap-2 text-xs">
                <span className="min-w-[90px] text-gray-400 dark:text-gray-600">og:title</span>
                <span className="truncate text-gray-600 dark:text-gray-400">{seo.ogTitle}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="min-w-[90px] text-gray-400 dark:text-gray-600">og:description</span>
                <span className="line-clamp-2 text-gray-600 dark:text-gray-400">{seo.ogDescription}</span>
              </div>
            </div>
          </div>
        ) : keywords ? (
          <div className="border-t border-gray-200 dark:border-gray-700/50 pt-3">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              SEO not yet generated — run AI with "Generate Keywords" selected.
            </p>
          </div>
        ) : null}

      </div>

      {/* ── Manual edit modal ── */}
      <ManualEditModal
        open={manualOpen}
        name={itemName}
        description={itemDescription}
        priceCents={itemPriceCents}
        onClose={() => setManualOpen(false)}
        onSave={(fields) => {
          onItemUpdated(fields);
          setManualOpen(false);
        }}
      />
    </>
  );
}