// src/context/BasketContext.tsx
"use client";

/**
 * BasketContext — server-backed basket with anonymous holding pen.
 *
 * Replaces the old localStorage-only CartContext. The mental model:
 *
 *   Signed-in:  the server is the source of truth. add/remove call the
 *               API, the in-memory list mirrors the server response, and
 *               localStorage isn't touched.
 *
 *   Signed-out: localStorage holds a "pending" list. add/remove are
 *               purely local. The list is what the customer sees in
 *               header counts + on /shop "in basket" indicators.
 *
 *   Sign-in transition: on the first authenticated load, any pending
 *               items in localStorage are POSTed to the server one by
 *               one. Successes are dropped from local; failures stay
 *               (those items are likely now-unavailable). After the
 *               replay finishes, localStorage is cleared and the
 *               server state is fetched fresh.
 *
 * The context exposes the same surface the old useCart did — add, remove,
 * has, count — so call sites (Header, DesktopItemCard, shop/[sku] page)
 * change their import and keep their logic.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import type { ReservationDto } from "@/types/customer";

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */

// What gets cached locally for an anonymous user. Must contain enough info
// to render the basket icon hover preview without a server roundtrip; on
// sign-in we replay using inventoryId only.
export type PendingItem = {
  inventoryId:    number;
  sku:            string;
  name:           string;
  unitPriceCents: number;
  thumbnailUrl:   string | null;
};

type BasketContextValue = {
  // Reading
  items:    PendingItem[];          // current display set (server when signed-in, local otherwise)
  count:    number;                 // active items only — used by header badge
  has:      (inventoryId: number) => boolean;
  loading:  boolean;                // initial load + sign-in replay

  // Writing
  add:      (item: PendingItem) => Promise<AddResult>;
  remove:   (inventoryId: number) => Promise<void>;
  refresh:  () => Promise<void>;    // re-fetch server state (after a remove from elsewhere)
};

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "already_in_basket" | "held_by_other" | "needs_signin" | "needs_email_verify" | "unavailable" | "error"; message?: string };

/* ─────────────────────────────────────────────────────────────────────────
   Context plumbing
───────────────────────────────────────────────────────────────────────── */

const BasketContext = createContext<BasketContextValue | null>(null);

const STORAGE_KEY = "ll-basket-pending";

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [items, setItems]     = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Track auth state across mounts so we can detect the sign-in transition
  // exactly once. Without this, a re-render during/after sign-in would
  // re-replay localStorage items the server already accepted.
  const replayDone = useRef(false);

  /* ── Local storage helpers (anonymous mode) ─────────────────────── */

  const readLocal  = useCallback((): PendingItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const writeLocal = useCallback((next: PendingItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota or private-browsing — silently fall through. The user can
      // still add items in this session; they just won't survive a reload.
    }
  }, []);

  /* ── API helpers (signed-in mode) ───────────────────────────────── */

  const apiCall = useCallback(async (path: string, opts?: RequestInit) => {
    const token = await getToken();
    return fetch(`/api${path}`, {
      ...opts,
      headers: {
        "Content-Type":  "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts?.headers ?? {}),
      },
    });
  }, [getToken]);

  // Convert a server ReservationDto[] into the PendingItem shape the rest
  // of the UI consumes. Active reservations only — expired ones live in
  // the basket tab's "recently expired" section, not the header count or
  // the shop "in basket" indicator.
  const fromServer = useCallback((rows: ReservationDto[]): PendingItem[] => {
    return rows
      .filter(r => r.status === "Active")
      .map(r => ({
        inventoryId:    r.inventoryId,
        sku:            r.itemSku ?? "",
        name:           r.itemName ?? "Linen Lady piece",
        unitPriceCents: r.unitPriceCents,
        thumbnailUrl:   r.thumbnailUrl,
      }));
  }, []);

  const fetchServerBasket = useCallback(async (): Promise<PendingItem[]> => {
    const res = await apiCall("/customers/me/basket");
    if (!res.ok) return [];
    const rows = await res.json() as ReservationDto[];
    return fromServer(rows);
  }, [apiCall, fromServer]);

  /* ── Sign-in replay (the "better UX" choice) ────────────────────── */

  const replayPending = useCallback(async (): Promise<PendingItem[]> => {
    const pending = readLocal();
    if (pending.length === 0) return [];

    // Try each item; collect failures so they don't get silently lost.
    // On a 403 (email not verified) we abort the replay entirely — the
    // server will reject all of them for the same reason.
    const failed: PendingItem[] = [];
    for (const item of pending) {
      try {
        const res = await apiCall("/customers/me/basket", {
          method: "POST",
          body:   JSON.stringify({ inventoryId: item.inventoryId, customerNotes: null }),
        });
        if (res.ok) continue;

        // Already-in-basket from a parallel session = success.
        if (res.status === 409) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const body = await res.json().catch(() => null) as { reason?: string } | null;
            if (body?.reason === "already_reserved_by_you") continue;
          }
        }

        // Email verification missing — abort and keep everything local
        // for a future replay.
        if (res.status === 403) {
          return pending;
        }

        // Anything else (404, 409 held by other, 500) → the item failed
        // to make it across; keep it locally so the header still shows
        // it and the user can remove it deliberately.
        failed.push(item);
      } catch {
        failed.push(item);
      }
    }

    writeLocal(failed);
    return failed;
  }, [readLocal, writeLocal, apiCall]);

  /* ── Initial load + auth transitions ────────────────────────────── */

  useEffect(() => {
    if (!isLoaded) return;

    const load = async () => {
      setLoading(true);

      if (isSignedIn) {
        // Sign-in transition: replay pending local items into the server
        // (once per session). After that, server is source of truth.
        if (!replayDone.current) {
          await replayPending();
          replayDone.current = true;
        }
        const fromApi = await fetchServerBasket();
        setItems(fromApi);
      } else {
        // Signed-out: local source of truth, replayDone resets so a
        // future sign-in still triggers replay.
        replayDone.current = false;
        setItems(readLocal());
      }

      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [isLoaded, isSignedIn, replayPending, fetchServerBasket, readLocal]);

  /* ── Mutations ──────────────────────────────────────────────────── */

  const has = useCallback(
    (inventoryId: number) => items.some(i => i.inventoryId === inventoryId),
    [items]
  );

  const add = useCallback(async (item: PendingItem): Promise<AddResult> => {
    // De-dupe locally regardless of mode — the server enforces uniqueness
    // too, but checking here saves a roundtrip and prevents UI flicker.
    if (items.some(i => i.inventoryId === item.inventoryId)) {
      return { ok: false, reason: "already_in_basket" };
    }

    if (!isSignedIn) {
      const next = [...items, item];
      writeLocal(next);
      setItems(next);
      return { ok: true };
    }

    try {
      const res = await apiCall("/customers/me/basket", {
        method: "POST",
        body:   JSON.stringify({ inventoryId: item.inventoryId, customerNotes: null }),
      });

      if (res.ok) {
        // Re-fetch rather than constructing locally — the server may have
        // canonicalized fields (name, price) and we want to be consistent.
        const fromApi = await fetchServerBasket();
        setItems(fromApi);
        return { ok: true };
      }

      // 409 with structured body = "you already have it" (race or stale UI)
      if (res.status === 409) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          const body = await res.json().catch(() => null) as { reason?: string } | null;
          if (body?.reason === "already_reserved_by_you") {
            const fromApi = await fetchServerBasket();
            setItems(fromApi);
            return { ok: false, reason: "already_in_basket" };
          }
        }
        return { ok: false, reason: "held_by_other", message: await res.text().catch(() => "") };
      }

      if (res.status === 403) {
        return { ok: false, reason: "needs_email_verify", message: await res.text().catch(() => "") };
      }

      return { ok: false, reason: "unavailable", message: await res.text().catch(() => "") };
    } catch (e) {
      return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Network error" };
    }
  }, [items, isSignedIn, writeLocal, apiCall, fetchServerBasket]);

  const remove = useCallback(async (inventoryId: number) => {
    if (!isSignedIn) {
      const next = items.filter(i => i.inventoryId !== inventoryId);
      writeLocal(next);
      setItems(next);
      return;
    }

    // Find the matching reservation id from the current items list. We
    // don't store reservationId in PendingItem to keep the anonymous
    // shape clean — for signed-in mode we re-fetch the basket and find
    // the row by inventoryId. One extra GET, but remove is rare.
    const res = await apiCall("/customers/me/basket");
    if (!res.ok) return;
    const rows = await res.json() as ReservationDto[];
    const match = rows.find(r => r.inventoryId === inventoryId && r.status === "Active");
    if (!match) {
      // Already gone — sync state and return.
      setItems(fromServer(rows));
      return;
    }

    await apiCall(`/customers/me/basket/${match.reservationId}`, { method: "DELETE" });
    const fromApi = await fetchServerBasket();
    setItems(fromApi);
  }, [items, isSignedIn, writeLocal, apiCall, fromServer, fetchServerBasket]);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setItems(readLocal());
      return;
    }
    setItems(await fetchServerBasket());
  }, [isSignedIn, readLocal, fetchServerBasket]);

  /* ── Provider ───────────────────────────────────────────────────── */

  const value = useMemo<BasketContextValue>(() => ({
    items,
    count: items.length,
    has,
    loading,
    add,
    remove,
    refresh,
  }), [items, has, loading, add, remove, refresh]);

  return (
    <BasketContext.Provider value={value}>
      {children}
    </BasketContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hook
───────────────────────────────────────────────────────────────────────── */

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside <BasketProvider>");
  return ctx;
}
