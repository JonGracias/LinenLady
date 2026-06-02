// src/context/StorefrontContext.tsx
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
import { useAuth, useUser } from "@clerk/nextjs";
import type {
  Category,
  GetItemsResponse,
  InventoryImage,
  InventoryItem,
} from "@/types/inventory";
import type {
  AvailabilityEntry,
  AvailabilityResponse,
  AvailabilityState,
} from "@/types/inventory";
import { isHardHidden } from "@/types/inventory";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * InventoryItem augmented with the optional availability state. When `state`
 * is undefined the item is available (the endpoint contract: only blocked
 * items appear in the response). Sold/Inactive items are filtered out
 * upstream so consumers never see them.
 */
export type StorefrontItem = InventoryItem & {
  state?:              AvailabilityState;
  blockingCustomerId?: number | null;
};

export type StorefrontContextValue = {
  items:      StorefrontItem[];
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

  // availability ─── new ─────────────────────────────────────────────────
  /**
   * Look up the cached state for a single inventoryId. Returns null when
   * we don't have an entry yet (treat as "available" only if the id is in
   * `items`, otherwise as "unknown"). Used by the SKU detail page so a
   * direct-link landing renders the right state without firing an extra
   * request when the storefront cache already has the answer.
   */
  getAvailabilityState: (id: number) => AvailabilityState | null;

  /**
   * One-shot availability check. Useful for the SKU detail page (which
   * may be deep-linked from outside the grid) and for the pre-flight
   * check inside `toggleBasket`. Bypasses the cache so we get an
   * up-to-the-moment answer — that's the whole point in those cases.
   */
  checkAvailability: (ids: number[]) => Promise<AvailabilityEntry[]>;

  /**
   * Force-refresh the availability map for the items currently in state.
   * Cheap (a single GET) and exposed so the SKU page / basket tab can
   * trigger it after mutations that may have freed a piece up.
   */
  refreshAvailability: () => Promise<void>;
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the comma-separated ids string for the availability endpoint.
 * Caps at 200 (server limit). For the storefront grid (pageSize ≤ ~24)
 * this is never hit, but the SKU detail page calling `checkAvailability`
 * with a related-items list could conceivably go higher.
 */
function idsParam(ids: number[]): string {
  return ids.slice(0, 200).join(",");
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const inFlight       = useRef<Set<number>>(new Set());
  const imagesInFlight = useRef<Set<number>>(new Set());
  const cacheRef       = useRef<Map<CacheKey, CacheEntry>>(new Map());

  const { isLoaded: authLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [images, setImages] = useState<Record<number, InventoryImage[]>>({});
  const [thumbs, setThumbs] = useState<Record<number, string | null>>({});

  // `items` here holds the *post-availability* list — Sold/Inactive removed,
  // blocked items annotated with `state`. The pre-availability list lives
  // in `rawItemsRef` so a sign-in/sign-out toggle can re-merge without
  // re-fetching the items API.
  const [items, setItems]    = useState<StorefrontItem[]>([]);
  const rawItemsRef          = useRef<InventoryItem[]>([]);

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

  // ── Availability ────────────────────────────────────────────────────────
  //
  // We mint a fresh Clerk token per call so an anonymous→signed-in transition
  // immediately produces YourBasket / YourPendingPayment states without a
  // page reload. The endpoint is anonymous-friendly so missing tokens are
  // fine.

  const fetchAvailability = useCallback(
    async (ids: number[]): Promise<AvailabilityEntry[]> => {
      if (ids.length === 0) return [];

      const token = isSignedIn ? await getToken().catch(() => null) : null;

      try {
        const res = await fetch(
          `/api/items/availability?ids=${encodeURIComponent(idsParam(ids))}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache:   "no-store",
          }
        );
        if (!res.ok) return [];
        const data = (await res.json()) as AvailabilityResponse;
        return Array.isArray(data?.items) ? data.items : [];
      } catch {
        // Network or parse failure → treat everything as available rather
        // than blocking the entire grid. The server still enforces on add().
        return [];
      }
    },
    [isSignedIn, getToken]
  );

  /**
   * Merge a raw items list with availability entries:
   *   • Sold / Inactive → dropped entirely
   *   • InBasket / PendingPayment / YourBasket / YourPendingPayment →
   *       kept, with `state` and `blockingCustomerId` attached
   *   • Available (no entry) → kept as-is
   */
  const mergeAvailability = useCallback(
    (raw: InventoryItem[], entries: AvailabilityEntry[]): StorefrontItem[] => {
      if (entries.length === 0) return raw.slice();

      const byId = new Map<number, AvailabilityEntry>();
      for (const e of entries) byId.set(e.inventoryId, e);

      const out: StorefrontItem[] = [];
      for (const item of raw) {
        const entry = byId.get(item.inventoryId);
        if (!entry) {
          out.push(item);
          continue;
        }
        if (isHardHidden(entry.state)) continue;
        out.push({
          ...item,
          state:              entry.state,
          blockingCustomerId: entry.blockingCustomerId,
        });
      }
      return out;
    },
    []
  );

  const applyAvailability = useCallback(
    async (raw: InventoryItem[]) => {
      // Optimistic: render the raw list immediately so users aren't staring
      // at a spinner waiting on availability. The merge replaces it once
      // the availability call resolves (usually <100ms).
      setItems(raw.slice());

      const ids     = raw.map((i) => i.inventoryId);
      const entries = await fetchAvailability(ids);

      // Guard against a race where the user paged forward while the call
      // was in flight. We only apply the merge if the raw list is still
      // the current one.
      if (rawItemsRef.current !== raw) return;

      setItems(mergeAvailability(raw, entries));
    },
    [fetchAvailability, mergeAvailability]
  );

  // ── Items ───────────────────────────────────────────────────────────────

  const loadItems = useCallback(async (skipCache = false) => {
    const cacheKey = getCacheKey(category, page, pageSize);

    if (!skipCache) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        rawItemsRef.current = cached.items;
        setTotalCount(cached.totalCount);
        setLoading(false);
        setError(null);
        // Always re-check availability even on a cache hit — the items
        // metadata is cacheable, the basket/order state is not.
        void applyAvailability(cached.items);
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

      if (typeof (data as any).Page === "number" && (data as any).Page !== page) {
        setPage((data as any).Page);
      }

      rawItemsRef.current = fetchedItems;
      setTotalCount(fetchedTotalCount);
      cacheRef.current.set(cacheKey, {
        items:      fetchedItems,
        totalCount: fetchedTotalCount,
        timestamp:  Date.now(),
      });

      if (typeof (data as any).page === "number" && (data as any).page !== page) {
        setPage((data as any).page);
      }

      await applyAvailability(fetchedItems);
    } catch (e: any) {
      rawItemsRef.current = [];
      setItems([]);
      setTotalCount(0);
      setError(e?.message ?? "Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, category, applyAvailability]);

  const reloadItems = useCallback(() => loadItems(true), [loadItems]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  // Sign-in / sign-out → re-run availability on the current items so the
  // YourBasket / YourPendingPayment states light up (or clear) without a
  // full page reload.
  useEffect(() => {
    if (!authLoaded)               return;
    if (rawItemsRef.current.length === 0) return;
    void applyAvailability(rawItemsRef.current);
  }, [authLoaded, isSignedIn,]);

  // ── Thumbnails ──────────────────────────────────────────────────────────
  // Auto-fetch thumbnails whenever items change
  useEffect(() => {
    items.forEach((item) => ensureThumbnail(item.inventoryId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (inFlight.current.has(id)) return;
      inFlight.current.add(id);

      void (async () => {
        try {
          const res  = await fetch(`/api/items/${id}/images?ttlMinutes=${ttlMinutes}`);
          const list: InventoryImage[] = res.ok ? await res.json() : [];
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

  // ── Images ──────────────────────────────────────────────────────────────

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

  // ── Availability accessors exposed on the context ───────────────────────

  const getAvailabilityState = useCallback(
    (id: number): AvailabilityState | null => {
      const found = items.find((i) => i.inventoryId === id);
      return found?.state ?? null;
    },
    [items]
  );

  const checkAvailability = useCallback(
    (ids: number[]): Promise<AvailabilityEntry[]> => fetchAvailability(ids),
    [fetchAvailability]
  );

  const refreshAvailability = useCallback(async () => {
    if (rawItemsRef.current.length === 0) return;
    await applyAvailability(rawItemsRef.current);
  }, [applyAvailability]);

  // ── Provider value ──────────────────────────────────────────────────────

  const value: StorefrontContextValue = useMemo(() => ({
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
    getAvailabilityState,
    checkAvailability,
    refreshAvailability,
  }), [
    items, loading, error,
    page, pageSize, totalCount, totalPages,
    category,
    getThumbnailUrl, ensureThumbnail,
    getImages, ensureImages, refreshImages,
    reloadItems,
    getAvailabilityState, checkAvailability, refreshAvailability,
  ]);

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}
