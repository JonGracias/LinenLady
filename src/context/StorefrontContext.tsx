"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Category,
  GetItemsResponse,
  InventoryImage,
  InventoryItem,
} from "@/types/inventory";

// ── Types ────────────────────────────────────────────────────────────────────

export type StorefrontContextValue = {
  items:      InventoryItem[];
  loading:    boolean;
  error:      string | null;

  // pagination
  page:       number;
  pageSize:   number;
  totalCount: number;
  totalPages: number;
  setPage:    (n: number) => void;
  setPageSize:(n: number) => void;

  // category filter
  category:    Category | null;
  setCategory: (c: Category | null) => void;

  // thumbnails
  getThumbnailUrl: (id: number) => string | null;
  ensureThumbnail: (id: number, ttlMinutes?: number) => void;

  // images
  getImages:     (id: number) => InventoryImage[] | null;
  ensureImages:  (id: number, ttlMinutes?: number) => void;
  refreshImages: (id: number, ttlMinutes?: number) => Promise<InventoryImage[]>;

  reloadItems: () => void;
};

// ── Context ──────────────────────────────────────────────────────────────────

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function useStorefrontContext() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error("StorefrontContext not found");
  return ctx;
}

// ── Cache ────────────────────────────────────────────────────────────────────

type CacheEntry = { items: InventoryItem[]; totalCount: number; timestamp: number };
type CacheKey   = string; // "category:page:pageSize"
const CACHE_TTL = 5 * 60 * 1000;

// ── Provider ─────────────────────────────────────────────────────────────────

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const inFlight       = useRef<Set<number>>(new Set());
  const imagesInFlight = useRef<Set<number>>(new Set());
  const cacheRef       = useRef<Map<CacheKey, CacheEntry>>(new Map());

  const [images, setImages] = useState<Record<number, InventoryImage[]>>({});
  const [thumbs, setThumbs] = useState<Record<number, string | null>>({});
  const [items,  setItems]  = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [category, setCategory] = useState<Category | null>(null);
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  );

  const getCacheKey = (cat: Category | null, p: number, ps: number): CacheKey =>
    `${cat ?? ""}:${p}:${ps}`;

  const isCacheValid = (entry: CacheEntry) =>
    Date.now() - entry.timestamp < CACHE_TTL;

  // Reset to page 1 on category / pageSize changes
  useEffect(() => { setPage(1); }, [category, pageSize]);

  const loadItems = useCallback(async (skipCache = false) => {
    const cacheKey = getCacheKey(category, page, pageSize);

    if (!skipCache) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        setItems(cached.items);
        setTotalCount(cached.totalCount);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page",   String(page));
      params.set("limit",  String(pageSize));
      params.set("status", "active"); // always published — never drafts or deleted
      if (category) params.set("category", category);

      const res  = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load items: ${res.status}`);
      const data: GetItemsResponse = await res.json();

      const fetchedItems      = Array.isArray(data.items) ? data.items : [];
      const fetchedTotalCount = Number(data.totalCount ?? 0);

      setItems(fetchedItems);
      setTotalCount(fetchedTotalCount);
      cacheRef.current.set(cacheKey, {
        items:      fetchedItems,
        totalCount: fetchedTotalCount,
        timestamp:  Date.now(),
      });

      if (typeof (data as any).page === "number" && (data as any).page !== page) {
        setPage((data as any).page);
      }
    } catch (e: any) {
      setItems([]);
      setTotalCount(0);
      setError(e?.message ?? "Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, category]);

  const reloadItems = useCallback(() => loadItems(true), [loadItems]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  // ── Thumbnails ──────────────────────────────────────────────────────────────
  // Auto-fetch thumbnails whenever items change
  useEffect(() => {
    items.forEach((item) => ensureThumbnail(item.InventoryId));
  }, [items]);

  const getThumbnailUrl = useCallback(
    (id: number) =>
      Object.prototype.hasOwnProperty.call(thumbs, id) ? thumbs[id] : null,
    [thumbs]
  );

  const ensureThumbnail = useCallback(
    (id: number, ttlMinutes = 60) => {
      if (typeof id !== "number" || !Number.isFinite(id)) {
        console.warn("ensureThumbnail: bad id", id, new Error().stack);
        return;
      }
      if (Object.prototype.hasOwnProperty.call(thumbs, id)) return;
      if (Object.prototype.hasOwnProperty.call(thumbs, id)) return;
      if (inFlight.current.has(id)) return;
      inFlight.current.add(id);

      void (async () => {
        try {
          const res  = await fetch(`/api/items/${id}/images?ttlMinutes=${ttlMinutes}`);
          const list: InventoryImage[] = res.ok ? await res.json() : [];
          const primary = list.find((i) => i?.IsPrimary) ?? list[0] ?? null;
          setThumbs((prev) => ({ ...prev, [id]: primary?.ReadUrl ?? null }));
        } catch {
          setThumbs((prev) => ({ ...prev, [id]: null }));
        } finally {
          inFlight.current.delete(id);
        }
      })();
    },
    [thumbs]
  );

  // ── Images ──────────────────────────────────────────────────────────────────

  const getImages = useCallback(
    (id: number): InventoryImage[] | null =>
      Object.prototype.hasOwnProperty.call(images, id) ? images[id] : null,
    [images]
  );

  const ensureImages = useCallback(
    (id: number, ttlMinutes = 60) => {
      if (typeof id !== "number" || !Number.isFinite(id)) {
      console.warn("ensureImages: bad id", id, new Error().stack);
      return;
      }

      if (Object.prototype.hasOwnProperty.call(images, id)) return;
      if (imagesInFlight.current.has(id)) return;
      imagesInFlight.current.add(id);

      void (async () => {
        try {
          const res  = await fetch(`/api/items/${id}/images?ttlMinutes=${ttlMinutes}`);
          const list: InventoryImage[] = res.ok ? await res.json() : [];
          setImages((prev) => ({ ...prev, [id]: list }));
        } catch {
          setImages((prev) => ({ ...prev, [id]: [] }));
        } finally {
          imagesInFlight.current.delete(id);
        }
      })();
    },
    [images]
  );

  const refreshImages = useCallback(async (id: number, ttlMinutes = 60) => {
    setImages((prev) => { const n = { ...prev }; delete n[id]; return n; });
    imagesInFlight.current.delete(id);

    try {
      const res  = await fetch(`/api/items/${id}/images?ttlMinutes=${ttlMinutes}`);
      const list: InventoryImage[] = res.ok ? await res.json() : [];
      setImages((prev) => ({ ...prev, [id]: list }));
      return list;
    } catch {
      setImages((prev) => ({ ...prev, [id]: [] }));
      return [];
    }
  }, []);

  const value: StorefrontContextValue = {
    items,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages,
    setPage,
    setPageSize,
    category,
    setCategory,
    getThumbnailUrl,
    ensureThumbnail,
    getImages,
    ensureImages,
    refreshImages,
    reloadItems,
  };

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}