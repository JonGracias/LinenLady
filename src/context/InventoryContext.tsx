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
import { apiGetJson } from "@/lib/request";
import type {
  Category,
  Filter,
  GetItemsResponse,
  InventoryContextValue,
  InventoryImage,
  InventoryItem,
} from "@/types/inventory";

export type AdminFilter = Filter;

/**
 * Extends the canonical InventoryContextValue (from @/types/inventory) with the
 * optimistic mutators used to keep the list "sticky" without a refresh.
 *
 * These live here rather than in @/types/inventory so the shared contract type
 * stays untouched. Consumers that only need the base fields are unaffected.
 */
export interface InventoryContextValueExt extends InventoryContextValue {
  /** Merge server/optimistic fields into the matching list row in place. */
  applyItemPatch: (id: number, patch: Partial<InventoryItem>) => void;
  /** Drop an item from the list (e.g. after delete). */
  removeItem: (id: number) => void;
  /** Update the cached thumbnail for a row (primary image changed/added). */
  setThumbnail: (id: number, url: string | null) => void;
}

const InventoryContext = createContext<InventoryContextValueExt | null>(null);

export function useInventoryContext(): InventoryContextValueExt {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("InventoryContext not found");
  return ctx;
}

type CountsResponse = { all: number; drafts: number; published: number };
type CacheEntry = { items: InventoryItem[]; totalCount: number; timestamp: number };
type CacheKey   = string;

const CACHE_TTL          = 5 * 60 * 1000;
const STORAGE_FILTER_KEY = "ll_admin_filter";
const STORAGE_CAT_KEY    = "ll_admin_category";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}

function writeStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const inFlight       = useRef<Set<number>>(new Set());
  const imagesInFlight = useRef<Set<number>>(new Set());
  const cacheRef       = useRef<Map<CacheKey, CacheEntry>>(new Map());
  // Mirror of `items` so optimistic mutators can read the previous row
  // synchronously (e.g. to compute count deltas) without a stale closure.
  const itemsRef       = useRef<InventoryItem[]>([]);

  const [images, setImages] = useState<Record<number, InventoryImage[]>>({});
  const [thumbs, setThumbs] = useState<Record<number, string | null>>({});
  const [items,  setItems]  = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Sticky filter / category — read from localStorage on init ──
  const [filter,   setFilterRaw]   = useState<Filter>(() => readStored<Filter>(STORAGE_FILTER_KEY, "all"));
  const [category, setCategoryRaw] = useState<Category | null>(() => readStored<Category | null>(STORAGE_CAT_KEY, null));
  const [page,     setPage]        = useState(1);
  const [pageSize, setPageSize]    = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [counts, setCounts] = useState<CountsResponse>({ all: 0, drafts: 0, published: 0 });

  // Wrap setters to also persist to localStorage
  const setFilter = useCallback((f: Filter) => {
    writeStored(STORAGE_FILTER_KEY, f);
    setFilterRaw(f);
  }, []);

  const setCategory = useCallback((c: Category | null) => {
    writeStored(STORAGE_CAT_KEY, c);
    setCategoryRaw(c);
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  );

  const sorted = useMemo(() => items, [items]);

  const statusParam = useMemo(() => {
    if (filter === "drafts")    return "draft";
    if (filter === "published") return "active";
    if (filter === "featured")  return "featured";
    return "all";
  }, [filter]);

  const getCacheKey = useCallback(
    (f: Filter, cat: Category | null, p: number, ps: number): CacheKey =>
      `${f}:${cat ?? ""}:${p}:${ps}`,
    []
  );

  const isCacheValid = useCallback(
    (entry: CacheEntry) => Date.now() - entry.timestamp < CACHE_TTL,
    []
  );

  const invalidateCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const invalidateFilterCache = useCallback((filterToInvalidate?: Filter) => {
    if (!filterToInvalidate) { invalidateCache(); return; }
    for (const key of cacheRef.current.keys()) {
      if (key.startsWith(`${filterToInvalidate}:`)) cacheRef.current.delete(key);
    }
  }, [invalidateCache]);

  const loadCounts = useCallback(async () => {
    try {
      const c = await apiGetJson<CountsResponse>("/api/items/counts");
      setCounts({
        all:       Number(c?.all       ?? 0),
        drafts:    Number(c?.drafts    ?? 0),
        published: Number(c?.published ?? 0),
      });
    } catch { /* non-fatal */ }
  }, []);

  const loadItems = useCallback(async (skipCache = false) => {
    const cacheKey = getCacheKey(filter, category, page, pageSize);

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
      params.set("status", statusParam);
      if (category) params.set("category", category);

      const data = await apiGetJson<GetItemsResponse>(`/api/items?${params.toString()}`);

      const fetchedItems      = Array.isArray(data.items) ? data.items : [];
      const fetchedTotalCount = Number(data.totalCount ?? 0);

      setItems(fetchedItems);
      setTotalCount(fetchedTotalCount);

      cacheRef.current.set(cacheKey, {
        items:      fetchedItems,
        totalCount: fetchedTotalCount,
        timestamp:  Date.now(),
      });

      // C# response is camelCase per GetItemsResponse — sync if upstream
      // clamped the page (e.g. requested page 5 but only 3 exist).
      if (typeof data.page === "number" && data.page !== page) {
        setPage(data.page);
      }
    } catch (e: unknown) {
      setItems([]);
      setTotalCount(0);
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusParam, filter, category, getCacheKey, isCacheValid]);

  const reloadItems = useCallback(() => loadItems(true), [loadItems]);

  // Keep the mirror ref current for the optimistic mutators below.
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Optimistic mutators ───────────────────────────────────────────────────
  // These make detail-screen edits "stick" in the shared list immediately, so
  // navigating back shows the change without a refresh. We also invalidate the
  // request cache so the next network fetch (or a full page refresh) reconciles
  // the UI with the authoritative API state.

  const findItem = useCallback(
    (id: number): InventoryItem | undefined => {
      const inList = itemsRef.current.find((x) => x.inventoryId === id);
      if (inList) return inList;
      for (const entry of cacheRef.current.values()) {
        const hit = entry.items.find((x) => x.inventoryId === id);
        if (hit) return hit;
      }
      return undefined;
    },
    []
  );

  const adjustCounts = useCallback(
    (prev: InventoryItem | undefined, next: InventoryItem | null) => {
      if (!prev) return;
      setCounts((c) => {
        let { all, drafts, published } = c;
        const prevActive = !!prev.isActive;
        const prevDraft  = !!prev.isDraft;
        const nextActive = next ? !!next.isActive : false;
        const nextDraft  = next ? !!next.isDraft  : false;

        if (!next) {
          // removal
          all = Math.max(0, all - 1);
          if (prevActive) published = Math.max(0, published - 1);
          if (prevDraft)  drafts    = Math.max(0, drafts - 1);
        } else {
          if (prevActive !== nextActive) published += nextActive ? 1 : -1;
          if (prevDraft  !== nextDraft)  drafts    += nextDraft  ? 1 : -1;
        }
        return {
          all,
          drafts:    Math.max(0, drafts),
          published: Math.max(0, published),
        };
      });
    },
    []
  );

  const applyItemPatch = useCallback(
    (id: number, patch: Partial<InventoryItem>) => {
      const prev = findItem(id);
      const next = prev ? { ...prev, ...patch } : null;
      setItems((list) =>
        list.map((x) => (x.inventoryId === id ? { ...x, ...patch } : x))
      );
      adjustCounts(prev, next);
      invalidateCache();
    },
    [findItem, adjustCounts, invalidateCache]
  );

  const removeItem = useCallback(
    (id: number) => {
      const prev = findItem(id);
      setItems((list) => list.filter((x) => x.inventoryId !== id));
      setTotalCount((t) => Math.max(0, t - 1));
      adjustCounts(prev, null);
      invalidateCache();
    },
    [findItem, adjustCounts, invalidateCache]
  );

  const setThumbnail = useCallback((id: number, url: string | null) => {
    setThumbs((prev) => ({ ...prev, [id]: url }));
  }, []);

  useEffect(() => { setPage(1); }, [filter, category, pageSize]);
  useEffect(() => { void loadItems(); }, [loadItems]);
  useEffect(() => { void loadCounts(); }, [loadCounts, filter]);

  // ── Thumbnails ──────────────────────────────────────────────────────────────

  const getThumbnailUrl = useCallback(
    (id: number) => Object.prototype.hasOwnProperty.call(thumbs, id) ? thumbs[id] : null,
    [thumbs]
  );

  const ensureThumbnail = useCallback(
    (id: number, ttlMinutes = 60) => {
      if (Object.prototype.hasOwnProperty.call(thumbs, id)) return;
      if (inFlight.current.has(id)) return;
      inFlight.current.add(id);

      void (async () => {
        try {
          const imgs = await apiGetJson<InventoryImage[]>(
            `/api/items/${id}/images?ttlMinutes=${ttlMinutes}`
          );
          const list    = Array.isArray(imgs) ? imgs : [];
          const primary = list.find((i) => i?.isPrimary) ?? list[0] ?? null;
          setThumbs((prev) => ({ ...prev, [id]: primary?.readUrl ?? null }));
        } catch {
          setThumbs((prev) => ({ ...prev, [id]: null }));
        } finally {
          inFlight.current.delete(id);
        }
      })();
    },
    [thumbs]
  );

  // ── Images dictionary ───────────────────────────────────────────────────────

  const getImages = useCallback(
    (id: number): InventoryImage[] | null =>
      Object.prototype.hasOwnProperty.call(images, id) ? images[id] : null,
    [images]
  );

  const ensureImages = useCallback(
    (id: number, ttlMinutes = 60) => {
      if (Object.prototype.hasOwnProperty.call(images, id)) return;
      if (imagesInFlight.current.has(id)) return;
      imagesInFlight.current.add(id);

      void (async () => {
        try {
          const imgs = await apiGetJson<InventoryImage[]>(
            `/api/items/${id}/images?ttlMinutes=${ttlMinutes}`
          );
          setImages((prev) => ({ ...prev, [id]: Array.isArray(imgs) ? imgs : [] }));
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
      const imgs = await apiGetJson<InventoryImage[]>(
        `/api/items/${id}/images?ttlMinutes=${ttlMinutes}`
      );
      const list = Array.isArray(imgs) ? imgs : [];
      setImages((prev) => ({ ...prev, [id]: list }));
      return list;
    } catch {
      setImages((prev) => ({ ...prev, [id]: [] }));
      return [];
    }
  }, []);

  const value: InventoryContextValueExt = {
    items,
    sorted,
    loading,
    error,
    filter,
    setFilter,
    category,
    setCategory,
    counts,
    page,
    pageSize,
    totalCount,
    totalPages,
    setPage,
    setPageSize,
    getThumbnailUrl,
    ensureThumbnail,
    getImages,
    ensureImages,
    refreshImages,
    invalidateCache,
    invalidateFilterCache,
    reloadItems,
    applyItemPatch,
    removeItem,
    setThumbnail,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
