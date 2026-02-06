// /context/InventoryContext.tsx

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
  InventoryItem,
  InventoryImage,
  InventoryContextValue,
  GetItemsResponse,
  Filter,
} from "@/types/inventory";

export type AdminFilter = Filter;

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function useInventoryContext() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("InventoryContext not found");
  return ctx;
}

type CountsResponse = {
  all: number;
  drafts: number;
  published: number;
};

type CacheEntry = {
  items: InventoryItem[];
  totalCount: number;
  timestamp: number;
};

type CacheKey = string; // Format: "filter:page:pageSize"

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  // Prevent duplicate per-item thumb fetches
  const inFlight = useRef<Set<number>>(new Set());
  
  // Prevent duplicate per-item images fetches
  const imagesInFlight = useRef<Set<number>>(new Set());

  // Images cache: InventoryId -> InventoryImage[]
  const [images, setImages] = useState<Record<number, InventoryImage[]>>({});

  // Thumbnail cache: InventoryId -> url|null
  const [thumbs, setThumbs] = useState<Record<number, string | null>>({});

  // Pagination cache: cacheKey -> CacheEntry
  const cacheRef = useRef<Map<CacheKey, CacheEntry>>(new Map());
  
  // Cache TTL in milliseconds (default: 5 minutes)
  const CACHE_TTL = 5 * 60 * 1000;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);

  const [totalCount, setTotalCount] = useState(0);

  const [counts, setCounts] = useState<CountsResponse>({
    all: 0,
    drafts: 0,
    published: 0,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  );

  // If you want to keep AdminItemsTable unchanged (sorted: items),
  // provide sorted as an alias. Backend already returns newest-first.
  const sorted = useMemo(() => items, [items]);

  const statusParam = useMemo(() => {
    return filter === "drafts"
      ? "draft"
      : filter === "published"
      ? "active"
      : "all";
  }, [filter]);

  // Generate cache key for current state
  const getCacheKey = useCallback(
    (f: Filter, p: number, ps: number): CacheKey => {
      return `${f}:${p}:${ps}`;
    },
    []
  );

  // Check if cache entry is valid
  const isCacheValid = useCallback(
    (entry: CacheEntry): boolean => {
      return Date.now() - entry.timestamp < CACHE_TTL;
    },
    [CACHE_TTL]
  );

  // Invalidate all cache entries
  const invalidateCache = useCallback(() => {
    cacheRef.current.clear();
    console.log("Cache invalidated");
  }, []);

  // Invalidate specific filter caches (for targeted invalidation)
  const invalidateFilterCache = useCallback((filterToInvalidate?: Filter) => {
    if (!filterToInvalidate) {
      invalidateCache();
      return;
    }

    const keysToDelete: CacheKey[] = [];
    cacheRef.current.forEach((_, key) => {
      if (key.startsWith(`${filterToInvalidate}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => cacheRef.current.delete(key));
    console.log(`Cache invalidated for filter: ${filterToInvalidate}`);
  }, [invalidateCache]);

  const loadCounts = useCallback(async () => {
    try {
      const c = await apiGetJson<CountsResponse>("/admin/api/items/counts");
      setCounts({
        all: Number(c?.all ?? 0),
        drafts: Number(c?.drafts ?? 0),
        published: Number(c?.published ?? 0),
      });
    } catch {
      // non-fatal; keep existing counts
    }
  }, []);

  const loadItems = useCallback(async (skipCache = false) => {
    const cacheKey = getCacheKey(filter, page, pageSize);

    // Check cache first (unless explicitly skipping)
    if (!skipCache) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        console.log(`Cache hit: ${cacheKey}`);
        setItems(cached.items);
        setTotalCount(cached.totalCount);
        setLoading(false);
        setError(null);
        return;
      }
    }

    console.log(`Cache miss: ${cacheKey}`);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("status", statusParam);

      const data = await apiGetJson<GetItemsResponse>(`/admin/api/items?${params.toString()}`);

      const fetchedItems = Array.isArray(data.items) ? data.items : [];
      const fetchedTotalCount = Number(data.totalCount ?? 0);

      setItems(fetchedItems);
      setTotalCount(fetchedTotalCount);

      // Store in cache
      cacheRef.current.set(cacheKey, {
        items: fetchedItems,
        totalCount: fetchedTotalCount,
        timestamp: Date.now(),
      });

      // If backend clamps page, align it
      if (typeof (data as any).page === "number" && (data as any).page !== page) {
        setPage((data as any).page);
      }
    } catch (e: any) {
      setItems([]);
      setTotalCount(0);
      setError(e?.message ?? "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusParam, filter, getCacheKey, isCacheValid]);

  // Force reload (bypass cache) - useful after mutations
  const reloadItems = useCallback(() => {
    loadItems(true);
  }, [loadItems]);

  // Reset to page 1 when filter or pageSize changes
  useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  // Reload items when page/pageSize/filter changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Load counts on mount, and whenever filter changes (optional)
  useEffect(() => {
    loadCounts();
  }, [loadCounts, filter]);

  // -----------------------------
  // Thumbnails
  // -----------------------------
  const getThumbnailUrl = useCallback(
    (InventoryId: number) => {
      return Object.prototype.hasOwnProperty.call(thumbs, InventoryId) ? thumbs[InventoryId] : null;
    },
    [thumbs]
  );

  const ensureThumbnail = useCallback(
    (InventoryId: number, ttlMinutes = 60) => {
      if (Object.prototype.hasOwnProperty.call(thumbs, InventoryId)) return;
      if (inFlight.current.has(InventoryId)) return;

      inFlight.current.add(InventoryId);

      (async () => {
        try {
          const imgs = await apiGetJson<InventoryImage[]>(
            `/admin/api/items/${InventoryId}/images?ttlMinutes=${encodeURIComponent(String(ttlMinutes))}`
          );

          const images = Array.isArray(imgs) ? imgs : [];
          const primary = images.find((i) => i?.IsPrimary) ?? images[0] ?? null;
          const thumbUrl = primary?.ReadUrl ?? null;

          setThumbs((prev) => ({ ...prev, [InventoryId]: thumbUrl }));
        } catch {
          setThumbs((prev) => ({ ...prev, [InventoryId]: null }));
        } finally {
          inFlight.current.delete(InventoryId);
        }
      })();
    },
    [thumbs]
  );

  // -----------------------------
  // Images Dictionary
  // -----------------------------
  
  /**
   * Get cached images for an inventory item
   * Returns the array of images if cached, null otherwise
   */
  const getImages = useCallback(
    (InventoryId: number): InventoryImage[] | null => {
      return Object.prototype.hasOwnProperty.call(images, InventoryId) 
        ? images[InventoryId] 
        : null;
    },
    [images]
  );

  /**
   * Ensure images are loaded for an inventory item
   * If already cached, does nothing. Otherwise fetches from API.
   */
  const ensureImages = useCallback(
    (InventoryId: number, ttlMinutes = 60) => {
      // Already cached
      if (Object.prototype.hasOwnProperty.call(images, InventoryId)) return;
      
      // Already fetching
      if (imagesInFlight.current.has(InventoryId)) return;

      imagesInFlight.current.add(InventoryId);

      (async () => {
        try {
          const imgs = await apiGetJson<InventoryImage[]>(
            `/admin/api/items/${InventoryId}/images?ttlMinutes=${encodeURIComponent(String(ttlMinutes))}`
          );

          const fetchedImages = Array.isArray(imgs) ? imgs : [];
          setImages((prev) => ({ ...prev, [InventoryId]: fetchedImages }));
        } catch {
          // Store empty array on error so we don't keep retrying
          setImages((prev) => ({ ...prev, [InventoryId]: [] }));
        } finally {
          imagesInFlight.current.delete(InventoryId);
        }
      })();
    },
    [images]
  );

  /**
   * Force refresh images for an inventory item
   * Useful after uploading/deleting images
   */
  const refreshImages = useCallback(
    async (InventoryId: number, ttlMinutes = 60) => {
      // Remove from cache first
      setImages((prev) => {
        const newImages = { ...prev };
        delete newImages[InventoryId];
        return newImages;
      });

      // Remove from in-flight tracking
      imagesInFlight.current.delete(InventoryId);

      // Fetch fresh
      try {
        const imgs = await apiGetJson<InventoryImage[]>(
          `/admin/api/items/${InventoryId}/images?ttlMinutes=${encodeURIComponent(String(ttlMinutes))}`
        );

        const fetchedImages = Array.isArray(imgs) ? imgs : [];
        setImages((prev) => ({ ...prev, [InventoryId]: fetchedImages }));
        
        return fetchedImages;
      } catch {
        setImages((prev) => ({ ...prev, [InventoryId]: [] }));
        return [];
      }
    },
    []
  );

  const value: InventoryContextValue = {
    // keep both for compatibility
    items,
    sorted,

    loading,
    error,

    filter,
    setFilter,

    // counts for AdminFilters
    counts,

    // paging
    page,
    pageSize,
    totalCount,
    totalPages,
    setPage,
    setPageSize,

    // thumbs for AdminItemsTable
    getThumbnailUrl,
    ensureThumbnail,

    // images dictionary
    getImages,
    ensureImages,
    refreshImages,

    // cache management
    invalidateCache,
    invalidateFilterCache,
    reloadItems,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}