// src/context/CustomerSessionContext.tsx
"use client";

/**
 * CustomerSessionContext — formerly BasketContext.
 *
 * Owns ALL signed-in customer state that gets consumed across multiple
 * pages of the storefront:
 *
 *   - The basket (active + expired reservations, server-side when signed-in)
 *   - Saved addresses
 *   - Orders (placed via checkout — Active, Paid, Cancelled, etc.)
 *   - The apiCall helper that wraps fetch with a Clerk bearer token
 *   - The in-progress inline-address-form draft (see "Address draft" below)
 *
 * AND the anonymous-mode basket holding pen (localStorage), which lets
 * customers add pieces before signing in and have them replay on auth.
 *
 * The mental model:
 *
 *   Signed-in:  the server is the source of truth. Mutations call the API
 *               and re-fetch; reservations + addresses arrays mirror the
 *               server response.
 *
 *   Signed-out: localStorage holds a "pending" list. add/remove are purely
 *               local. reservations stays empty, addresses stays empty.
 *               The page-level basket UI renders the pending list directly.
 *
 *   Sign-in transition: on the first authenticated load we run, in order:
 *
 *                 1. syncCustomerOnce — POST /api/customers/sync so the
 *                    cust.Customer row exists before any customer-scoped
 *                    endpoint is hit.
 *                 2. replayPending — POST localStorage items to the basket.
 *                 3. fetchSession — pull basket + addresses in parallel.
 *
 * Why one context for both: the address picker on /basket needs addresses,
 * the address tab in /account also needs addresses, and a mutation in
 * either place should update both surfaces. Same logic for basket. One
 * context owning both means the data is in one place, fetched once,
 * mutated consistently.
 *
 * ── Address draft (added) ────────────────────────────────────────────
 *
 * CheckoutPanel's inline address form previously held its open/closed
 * flag (CheckoutPanel) and its field values (InlineAddressForm) in local
 * useState. That state did not survive a remount — and BasketTab remounts
 * "every so often" because Clerk auth-refresh events invalidate the RSC
 * cache and re-render the server component tree (see BasketTab's header
 * comment). Every remount wiped a half-typed address and forced the
 * customer to start over.
 *
 * The draft now lives HERE because CustomerSessionProvider sits high in
 * the tree and does NOT remount on those auth-refresh events. CheckoutPanel
 * reads `addressDraft.formOpen`; InlineAddressForm reads/writes the field
 * values through `addressDraft` / `setAddressDraft`. A remount re-reads the
 * same surviving draft, so the customer sees their work intact.
 *
 * The draft is cleared on two INTENTIONAL user actions: a successful save
 * (the address now exists; reopening means "add another") and Cancel (an
 * explicit discard). It is NOT cleared on remount — that's the whole point.
 *
 * Public API surface (the bit consumers care about):
 *
 *   // Display-shape basket items (header badge, "in basket" indicators)
 *   items, count, has
 *
 *   // Full server payload (for the /basket page and basket tab)
 *   reservations, addresses
 *
 *   // Status
 *   loading
 *
 *   // Anonymous-friendly add/remove (handles signed-in vs not internally)
 *   add, remove
 *
 *   // Signed-in-only operations against specific reservation rows
 *   removeReservation, reAddReservation, checkout
 *
 *   // Refetchers (call after external mutations)
 *   refresh, refreshAddresses
 *
 *   // Inline-address-form draft (survives BasketTab remounts)
 *   addressDraft, setAddressDraft, clearAddressDraft
 *
 *   // Shared HTTP helper — exposes the same fetch wrapper the context
 *   // uses internally so call sites don't recreate it
 *   apiCall
 */

import {
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
  ReservationDto,
  CustomerAddressDto,
  OrderDto,
} from "@/types/customer";

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */

// What gets cached locally for an anonymous user. Must contain enough info
// to render the basket icon hover preview / basket page without a server
// roundtrip; on sign-in we replay using inventoryId only.
export type PendingItem = {
  inventoryId:    number;
  sku:            string;
  name:           string;
  unitPriceCents: number;
  thumbnailUrl:   string | null;
};

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "sold" | "already_in_basket" | "held_by_other" | "needs_signin" | "needs_email_verify" | "unavailable" | "error"; message?: string };

export type CheckoutRequestShape = {
  reservationIds: number[];
  addressId:      number;
  customerNotes:  string | null;
};

export type CheckoutResult =
  | { ok: true;  order: OrderDto }
  | { ok: false; message: string };

// Cancel result distinguishes the "you waited too long" case from
// generic failures, so the frontend can route the customer to the
// message-Noemi flow specifically for the paid-order case rather than
// showing a generic error.
export type CancelOrderResult =
  | { ok: true;  order: OrderDto }
  | { ok: false; reason: "not_cancellable" | "not_found" | "error"; message: string; currentStatus?: string };

/**
 * The in-progress inline-address-form draft. Mirrors InlineAddressForm's
 * old local FormState plus the `formOpen` flag CheckoutPanel used to own.
 * Held in the context so it survives BasketTab/CheckoutPanel remounts.
 */
export type AddressDraft = {
  formOpen:  boolean;
  label:     string;
  street1:   string;
  street2:   string;
  city:      string;
  state:     string;
  zip:       string;
  isDefault: boolean;
};
export type NotesDraft   = { notes: string };

const EMPTY_ADDRESS_DRAFT: AddressDraft = {
  formOpen:  false,
  label:     "",
  street1:   "",
  street2:   "",
  city:      "",
  state:     "",
  zip:       "",
  isDefault: false,
};
const EMPTY_NOTES_DRAFT:   NotesDraft   = { notes: "" };

type CustomerSessionContextValue = {
  // ── Reading (display shape) ──────────────────────────────────────
  items:    PendingItem[];           // active basket as PendingItem rows
  count:    number;                  // items.length, used by header badge
  has:      (inventoryId: number) => boolean;
  loading:  boolean;

  // ── Reading (full server shape, signed-in only) ──────────────────
  reservations: ReservationDto[];    // includes Expired rows for basket UI
  addresses:    CustomerAddressDto[];
  orders:       OrderDto[];          // all customer orders, newest first

  // ── Anonymous-aware add/remove (work signed-out too) ─────────────
  add:      (item: PendingItem) => Promise<AddResult>;
  remove:   (inventoryId: number) => Promise<void>;

  // ── Signed-in-only operations by reservation id ──────────────────
  removeReservation: (reservationId: number) => Promise<ReservationDto | null>;
  reAddReservation:  (reservationId: number) => Promise<ReservationDto | null>;
  checkout:          (req: CheckoutRequestShape) => Promise<CheckoutResult>;

  // ── Signed-in-only operations by order id ────────────────────────
  cancelOrder:       (orderId: number) => Promise<CancelOrderResult>;

  // ── Inline-address-form draft (survives remounts) ────────────────
  addressDraft:      AddressDraft;
  setAddressDraft:   React.Dispatch<React.SetStateAction<AddressDraft>>;
  clearAddressDraft: () => void;

  notesDraft: NotesDraft;
  setNotesDraft: React.Dispatch<React.SetStateAction<NotesDraft>>;
  clearNotesDraft: () => void;

  // ── Refetchers + shared helper ───────────────────────────────────
  refresh:          () => Promise<void>;
  refreshAddresses: () => Promise<void>;
  refreshOrders:    () => Promise<void>;
  apiCall:          (path: string, opts?: RequestInit) => Promise<Response>;
};

/* ─────────────────────────────────────────────────────────────────────────
   Context plumbing
───────────────────────────────────────────────────────────────────────── */

const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(null);

const STORAGE_KEY = "ll-basket-pending";

export function CustomerSessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Anonymous mode lives in `pending`. Signed-in mode populates `reservations`
  // (full server payload) and `addresses`. The display-shape `items` array
  // is a memoized union — pending when signed-out, active reservations
  // otherwise — so header/card consumers don't care which mode is active.
  const [pending,      setPending]      = useState<PendingItem[]>([]);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [addresses,    setAddresses]    = useState<CustomerAddressDto[]>([]);
  const [orders,       setOrders]       = useState<OrderDto[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Inline-address-form draft. Lives here (not in CheckoutPanel /
  // InlineAddressForm) so it survives the BasketTab remounts that Clerk
  // auth-refresh events trigger. See the "Address draft" note in the file
  // header for the full rationale.
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(EMPTY_ADDRESS_DRAFT);
  const clearAddressDraft = useCallback(() => setAddressDraft(EMPTY_ADDRESS_DRAFT), []);

  const [notesDraft, setNotesDraft] = useState<NotesDraft>(EMPTY_NOTES_DRAFT);
  const clearNotesDraft = useCallback(() => setNotesDraft(EMPTY_NOTES_DRAFT), []);

  // Once-per-session guard rails. Sync + replay each run exactly once per
  // sign-in. Reset on sign-out so account-switching re-syncs.
  const syncDone   = useRef(false);
  const replayDone = useRef(false);

  /* ── Local storage helpers (anonymous mode) ─────────────────────── */

  const readLocal = useCallback((): PendingItem[] => {
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

  /* ── apiCall: the one fetch wrapper ─────────────────────────────── */

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

  /* ── Server fetchers ────────────────────────────────────────────── */

  const fetchBasket = useCallback(async (): Promise<ReservationDto[]> => {
    const res = await apiCall("/customers/me/basket");
    if (!res.ok) return [];
    return res.json() as Promise<ReservationDto[]>;
  }, [apiCall]);

  const fetchAddresses = useCallback(async (): Promise<CustomerAddressDto[]> => {
    // Addresses ride along on the /customers/me profile payload — no
    // separate endpoint. If we add one later, swap this URL and the
    // shape-destructure below.
    const res = await apiCall("/customers/me");
    if (!res.ok) return [];
    const data = await res.json() as { addresses?: CustomerAddressDto[] };
    return data.addresses ?? [];
  }, [apiCall]);

  const fetchOrders = useCallback(async (): Promise<OrderDto[]> => {
    // Orders have their own endpoint — paginated server-side in the future
    // probably, but for now returns the full customer order history newest
    // first. The Orders sub-view on /basket reads from this.
    const res = await apiCall("/customers/me/orders");
    if (!res.ok) return [];
    return res.json() as Promise<OrderDto[]>;
  }, [apiCall]);

  /* ── Customer sync (the auth-boundary one-shot) ─────────────────── */

  const syncCustomerOnce = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (syncDone.current) return true;

    try {
      const res = await apiCall("/customers/sync", {
        method: "POST",
        body: JSON.stringify({
          clerkUserId:     user.id,
          email:           user.primaryEmailAddress?.emailAddress ?? "",
          firstName:       user.firstName ?? "",
          lastName:        user.lastName  ?? "",
          isEmailVerified: user.primaryEmailAddress?.verification?.status === "verified",
        }),
      });
      syncDone.current = true;
      return res.ok;
    } catch {
      return false;
    }
  }, [user, apiCall]);

  /* ── Sign-in replay ─────────────────────────────────────────────── */

  const replayPending = useCallback(async (): Promise<PendingItem[]> => {
    const queue = readLocal();
    if (queue.length === 0) return [];

    const failed: PendingItem[] = [];
    for (const item of queue) {
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

        // Email verification missing → abort, keep local for next time.
        if (res.status === 403) return queue;

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
        // 1. Sync the customer row first so any subsequent customer-scoped
        //    endpoint can find a cust.Customer for the JWT's sub.
        await syncCustomerOnce();

        // 2. Replay anonymous-mode pending items into server reservations.
        if (!replayDone.current) {
          await replayPending();
          replayDone.current = true;
        }

        // 3. Fan-out fetch the things the storefront actually needs
        //    available across pages: reservations + addresses + orders.
        //    All three in parallel — the basket page's tab bar shows the
        //    orders count immediately if the customer lands on /basket
        //    directly after sign-in.
        const [b, a, o] = await Promise.all([
          fetchBasket(),
          fetchAddresses(),
          fetchOrders(),
        ]);
        setReservations(b);
        setAddresses(a);
        setOrders(o);
        setPending([]); // server is the source of truth now
      } else {
        // Signed-out: reset one-shot flags so a subsequent sign-in re-runs
        // sync + replay. Read from localStorage.
        replayDone.current = false;
        syncDone.current   = false;
        setReservations([]);
        setAddresses([]);
        setOrders([]);
        setPending(readLocal());
        // Sign-out also abandons any in-progress address draft — it
        // belonged to the signed-in customer who just left.
        setAddressDraft(EMPTY_ADDRESS_DRAFT);
        setNotesDraft(EMPTY_NOTES_DRAFT);
      }

      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [
    isLoaded, isSignedIn,
    syncCustomerOnce, replayPending,
    fetchBasket, fetchAddresses, fetchOrders, readLocal,
  ]);

  /* ── Derived display surface ────────────────────────────────────── */

  // The "items" projection — what header badges and card "in basket" checks
  // consume. Signed-in → active reservations as PendingItem rows. Signed-out
  // → the localStorage pending list as-is.
  const items: PendingItem[] = useMemo(() => {
    if (!isSignedIn) return pending;
    return reservations
      .filter(r => r.status === "Active")
      .map(r => ({
        inventoryId:    r.inventoryId,
        sku:            r.itemSku ?? "",
        name:           r.itemName ?? "Linen Lady piece",
        unitPriceCents: r.unitPriceCents,
        thumbnailUrl:   r.thumbnailUrl,
      }));
  }, [isSignedIn, pending, reservations]);

  const has = useCallback(
    (inventoryId: number) => items.some(i => i.inventoryId === inventoryId),
    [items]
  );

  /* ── Mutations: anonymous-aware ─────────────────────────────────── */

  const add = useCallback(async (item: PendingItem): Promise<AddResult> => {
    // De-dupe locally regardless of mode.
    if (items.some(i => i.inventoryId === item.inventoryId)) {
      return { ok: false, reason: "already_in_basket" };
    }

    if (!isSignedIn) {
      const next = [...pending, item];
      writeLocal(next);
      setPending(next);
      return { ok: true };
    }

    // Belt-and-suspenders for the race where Clerk's auth state flips
    // between the effect and a click.
    await syncCustomerOnce();

    try {
      const res = await apiCall("/customers/me/basket", {
        method: "POST",
        body:   JSON.stringify({ inventoryId: item.inventoryId, customerNotes: null }),
      });

      if (res.ok) {
        setReservations(await fetchBasket());
        return { ok: true };
      }

      if (res.status === 409) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          const body = await res.json().catch(() => null) as { reason?: string } | null;
          if (body?.reason === "already_reserved_by_you") {
            setReservations(await fetchBasket());
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
  }, [items, pending, isSignedIn, writeLocal, apiCall, fetchBasket, syncCustomerOnce]);

  // Remove by inventoryId — works in both modes. Signed-out: drop from
  // localStorage. Signed-in: find the matching active reservation and
  // DELETE it through the server.
  const remove = useCallback(async (inventoryId: number) => {
    if (!isSignedIn) {
      const next = pending.filter(i => i.inventoryId !== inventoryId);
      writeLocal(next);
      setPending(next);
      return;
    }

    const match = reservations.find(
      r => r.inventoryId === inventoryId && r.status === "Active"
    );
    if (!match) {
      // Already gone from the active set — re-sync to be safe.
      setReservations(await fetchBasket());
      return;
    }

    await apiCall(`/customers/me/basket/${match.reservationId}`, { method: "DELETE" });
    setReservations(await fetchBasket());
  }, [pending, reservations, isSignedIn, writeLocal, apiCall, fetchBasket]);

  /* ── Mutations: signed-in only, by reservation id ───────────────── */

  // Returns the updated (now-Expired) row so the caller can keep it in
  // their list with the canReAdd flag. Returns null on failure; caller
  // surfaces the error to the user.
  const removeReservation = useCallback(
    async (reservationId: number): Promise<ReservationDto | null> => {
      const res = await apiCall(`/customers/me/basket/${reservationId}`, { method: "DELETE" });
      if (!res.ok) return null;
      const updated = await res.json() as ReservationDto;
      // Replace the row in-place so the basket UI transitions Active → Expired
      // without a refetch flicker. Then re-fetch to be authoritative.
      setReservations(prev => prev.map(r => r.reservationId === reservationId ? updated : r));
      // Also refresh in case the server returned more than the one row.
      fetchBasket().then(setReservations).catch(() => { /* in-place update covers us */ });
      return updated;
    },
    [apiCall, fetchBasket]
  );

  const reAddReservation = useCallback(
    async (reservationId: number): Promise<ReservationDto | null> => {
      const res = await apiCall(`/customers/me/basket/${reservationId}/re-add`, { method: "POST" });
      if (!res.ok) return null;
      const created = await res.json() as ReservationDto;
      // The expired row stays — we just append the new active one. The
      // basket UI re-renders the expired row as "Back in your basket"
      // automatically when it sees a matching inventoryId in the active set.
      setReservations(prev => [...prev, created]);
      return created;
    },
    [apiCall]
  );

  const checkout = useCallback(
    async (req: CheckoutRequestShape): Promise<CheckoutResult> => {
      try {
        const res = await apiCall("/checkout", {
          method: "POST",
          body:   JSON.stringify(req),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return { ok: false, message: text || `HTTP ${res.status}` };
        }
        const order = await res.json() as OrderDto;
        // Checkout converts active reservations into an order — the basket
        // is now (largely) empty server-side. Re-fetch both reservations
        // and orders so the header badge, basket page Active sub-view, and
        // Orders sub-view all agree.
        const [b, o] = await Promise.all([fetchBasket(), fetchOrders()]);
        setReservations(b);
        setOrders(o);
        clearNotesDraft(); 
        return { ok: true, order };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Network error" };
      }
    },
    [apiCall, fetchBasket, fetchOrders, clearNotesDraft]
  );

  // cancelOrder — customer self-serve cancel for PaymentPending orders.
  // The backend handles ownership + state checks; this just dispatches
  // and refreshes local state.
  //
  // Three failure modes are surfaced distinctly so OrdersTab can render
  // appropriate UX:
  //   - "not_cancellable" → typically because the order is now Paid
  //     (Square webhook beat the customer's click). UI should route the
  //     customer to the message thread with a prefilled "I wanted to
  //     cancel order #N but it's already paid" body.
  //   - "not_found"      → order doesn't exist or isn't theirs. UI
  //     shows a generic error and refreshes the orders list.
  //   - "error"          → network or unknown server error. UI shows
  //     the message verbatim and lets the customer retry.
  //
  // On success we re-fetch BOTH orders and basket — the cancel releases
  // the inventory holds, so any availability state cached by other
  // components should be revalidated. The simplest correct thing is to
  // also nudge the storefront context to re-check availability, but
  // that's a cross-context call we don't have a hook for yet. For now
  // the basket+orders refresh covers the customer's own view; the shop
  // grid's availability cache refreshes on its next periodic tick.
  const cancelOrder = useCallback(
    async (orderId: number): Promise<CancelOrderResult> => {
      try {
        const res = await apiCall(`/customers/me/orders/${orderId}/cancel`, {
          method: "POST",
        });

        if (res.ok) {
          const order = await res.json() as OrderDto;
          // Refresh orders so the row shows Cancelled, and basket because
          // the released items may have come back to the active list.
          const [o, b] = await Promise.all([fetchOrders(), fetchBasket()]);
          setOrders(o);
          setReservations(b);
          return { ok: true, order };
        }

        // 409 = OrderNotCancellableException, with structured body
        // distinguishing the paid-order case from generic conflicts.
        if (res.status === 409) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const body = await res.json().catch(() => null) as
              { reason?: string; message?: string; currentStatus?: string } | null;
            return {
              ok: false,
              reason: "not_cancellable",
              message: body?.message ?? "This order can no longer be cancelled.",
              currentStatus: body?.currentStatus,
            };
          }
          return {
            ok: false,
            reason: "not_cancellable",
            message: await res.text().catch(() => "This order can no longer be cancelled."),
          };
        }

        if (res.status === 404) {
          return {
            ok: false,
            reason: "not_found",
            message: "That order couldn't be found.",
          };
        }

        return {
          ok: false,
          reason: "error",
          message: await res.text().catch(() => `HTTP ${res.status}`),
        };
      } catch (e) {
        return {
          ok: false,
          reason: "error",
          message: e instanceof Error ? e.message : "Network error",
        };
      }
    },
    [apiCall, fetchOrders, fetchBasket]
  );

  /* ── Refetchers ─────────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setPending(readLocal());
      return;
    }
    setReservations(await fetchBasket());
  }, [isSignedIn, readLocal, fetchBasket]);

  const refreshAddresses = useCallback(async () => {
    if (!isSignedIn) {
      setAddresses([]);
      return;
    }
    setAddresses(await fetchAddresses());
  }, [isSignedIn, fetchAddresses]);

  const refreshOrders = useCallback(async () => {
    if (!isSignedIn) {
      setOrders([]);
      return;
    }
    setOrders(await fetchOrders());
  }, [isSignedIn, fetchOrders]);

  /* ── Provider ───────────────────────────────────────────────────── */

  const value = useMemo<CustomerSessionContextValue>(() => ({
    items,
    count: items.length,
    has,
    loading,
    reservations,
    addresses,
    orders,
    add,
    remove,
    removeReservation,
    reAddReservation,
    checkout,
    cancelOrder,
    addressDraft,
    setAddressDraft,
    clearAddressDraft,
    refresh,
    refreshAddresses,
    refreshOrders,
    apiCall,
    notesDraft,
    setNotesDraft,
    clearNotesDraft,
  }), [
    items, has, loading, reservations, addresses, orders,
    add, remove, removeReservation, reAddReservation, checkout, cancelOrder,
    addressDraft, setAddressDraft, clearAddressDraft,
    refresh, refreshAddresses, refreshOrders, apiCall, notesDraft, setNotesDraft, clearNotesDraft
  ]);

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hook
───────────────────────────────────────────────────────────────────────── */

export function useCustomerSession() {
  const ctx = useContext(CustomerSessionContext);
  if (!ctx) {
    throw new Error("useCustomerSession must be used inside <CustomerSessionProvider>");
  }
  return ctx;
}
