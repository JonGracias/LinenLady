// src/context/InventoryContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InventoryItem, InventoryImage } from "@/types/inventory";
import { apiGetJson } from "@/lib/request";

export type AdminFilter = "all" | "drafts" | "published";
type GetItemsResponse = { items: InventoryItem[] };

type ThumbResponse = { thumbUrl: string | null };

interface InventoryContextType {
  items: InventoryItem[];
  loading: boolean;
  error?: string | null;

  filter: AdminFilter;
  currentPage: number;
  pageSize: number;

  visibleItems: InventoryItem[];
  sorted: InventoryItem[];
  totalPages: number;
  counts: { all: number; drafts: number; published: number };

  setFilter: (f: AdminFilter) => void;
  setCurrentPage: (p: number) => void;
  setPageSize: (n: number) => void;

  // NEW: thumbnails
  getThumbnailUrl: (inventoryId: number) => string | null;
  ensureThumbnail: (inventoryId: number, ttlMinutes?: number) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function isDraft(x: InventoryItem) {
  return x.IsDraft && !x.IsDeleted;
}

function isPublished(x: InventoryItem) {
  return x.IsActive && !x.IsDraft && !x.IsDeleted;
}

function normalizeFilter(v: string | null | undefined): AdminFilter {
  return v === "drafts" ? "drafts" : v === "published" ? "published" : "all";
}

function normalizePage(v: string | null | undefined) {
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NEW: thumbnail cache (inventoryId -> url|null)
  const [thumbs, setThumbs] = useState<Record<number, string | null>>({});
  const inFlight = useRef<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiGetJson<GetItemsResponse>("/admin/api/items");
        const next = Array.isArray(data?.items) ? data.items : [];
        if (mounted) setItems(next);
      } catch (e: any) {
        if (mounted) {
          setItems([]);
          setError(e?.message ?? "Failed to load items");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // -----------------------------
  // ADMIN LIST STATE (client)
  // -----------------------------
  const [filter, _setFilter] = useState<AdminFilter>(() => normalizeFilter(sp.get("filter")));
  const [currentPage, _setCurrentPage] = useState<number>(() => normalizePage(sp.get("page")));

  // keep at 7 to match your AdminPagination behavior
  const [pageSize, _setPageSize] = useState<number>(7);

  useEffect(() => {
    const nextFilter = normalizeFilter(sp.get("filter"));
    const nextPage = normalizePage(sp.get("page"));

    if (nextFilter !== filter) _setFilter(nextFilter);
    if (nextPage !== currentPage) _setCurrentPage(nextPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  function replaceQuery(next: { filter?: AdminFilter; page?: number }) {
    const params = new URLSearchParams(sp.toString());

    if (next.filter) params.set("filter", next.filter);
    if (typeof next.page === "number") params.set("page", String(next.page));

    if (params.get("filter") === "all") params.delete("filter");
    if (params.get("page") === "1") params.delete("page");

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const setFilter = (f: AdminFilter) => {
    _setFilter(f);
    _setCurrentPage(1);
    replaceQuery({ filter: f, page: 1 });
  };

  const setCurrentPage = (p: number) => {
    const next = Math.max(1, Math.floor(p));
    _setCurrentPage(next);
    replaceQuery({ filter, page: next });
  };

  const setPageSize = (n: number) => {
    const next = Math.max(1, Math.floor(n));
    _setPageSize(next);
    _setCurrentPage(1);
    replaceQuery({ filter, page: 1 });
  };

  // -----------------------------
  // DERIVED LISTS
  // -----------------------------
  const filtered = useMemo(() => {
    if (filter === "drafts") return items.filter(isDraft);
    if (filter === "published") return items.filter(isPublished);
    return items.filter((x) => !x.IsDeleted);
  }, [items, filter]);

  const allSorted = useMemo(() => {
    const clone = [...filtered];
    clone.sort((a, b) => (a.UpdatedAt < b.UpdatedAt ? 1 : -1));
    return clone;
  }, [filtered]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(allSorted.length / pageSize));
  }, [allSorted.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const sorted = useMemo(() => {
    const offset = (currentPage - 1) * pageSize;
    return allSorted.slice(offset, offset + pageSize);
  }, [allSorted, currentPage, pageSize]);

  const counts = useMemo(() => {
    return {
      all: items.filter((x) => !x.IsDeleted).length,
      drafts: items.filter(isDraft).length,
      published: items.filter(isPublished).length,
    };
  }, [items]);

  // -----------------------------
  // NEW: thumbnails
  // -----------------------------
  const getThumbnailUrl = (inventoryId: number) => {
    return Object.prototype.hasOwnProperty.call(thumbs, inventoryId) ? thumbs[inventoryId] : null;
  };

  const ensureThumbnail = (inventoryId: number, ttlMinutes = 60) => {
    if (Object.prototype.hasOwnProperty.call(thumbs, inventoryId)) return;
    if (inFlight.current.has(inventoryId)) return;

    inFlight.current.add(inventoryId);

    (async () => {
      try {
        const imgs = await apiGetJson<InventoryImage[]>(
          `/admin/api/items/${inventoryId}/images?ttlMinutes=${encodeURIComponent(String(ttlMinutes))}`
        );

        const images = Array.isArray(imgs) ? imgs : [];
        const primary = images.find((i) => i?.IsPrimary) ?? images[0] ?? null;
        const thumbUrl = primary?.ReadUrl ?? null;

        setThumbs((prev) => ({ ...prev, [inventoryId]: thumbUrl }));
      } catch {
        setThumbs((prev) => ({ ...prev, [inventoryId]: null }));
      } finally {
        inFlight.current.delete(inventoryId);
      }
    })();
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        loading,
        error,

        filter,
        currentPage,
        pageSize,

        visibleItems: allSorted,
        sorted,
        totalPages,
        counts,

        setFilter,
        setCurrentPage,
        setPageSize,

        getThumbnailUrl,
        ensureThumbnail,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryContext() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventoryContext must be used inside InventoryProvider");
  return ctx;
}
