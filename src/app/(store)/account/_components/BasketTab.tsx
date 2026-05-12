// src/app/(store)/account/_components/BasketTab.tsx
//
// Orchestrator for the basket tab. Owns network calls, basket state, and
// provider sync — delegates rendering to ActiveReservations (in-basket)
// and ExpiredReservations (recently expired), with CheckoutPanel pinned
// as the right rail.
//
// Layout: a small inline tab switch (ACTIVE / EXPIRED) flips between the
// two list views. The EXPIRED tab is only shown when there's something
// to put in it; otherwise the switch hides and the active view fills the
// column unaccompanied.
//
// What lives here vs. children: the children are dumb — they get already-
// bound callbacks and display data. All async, all error/submit state,
// all useBasket() coordination stays in the parent so the children are
// trivially testable and the data flow is one-way.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReservationDto, CustomerAddressDto } from "@/types/customer";
import { useBasket } from "@/context/BasketContext";
import ActiveReservations from "./basket/ActiveReservations";
import ExpiredReservations from "./basket/ExpiredReservations";
import CheckoutPanel from "./basket/CheckoutPanel";

type BasketTabProps = {
  reservations: ReservationDto[];
  addresses:    CustomerAddressDto[];
  apiCall:      (path: string, opts?: RequestInit) => Promise<Response>;
  onChange:     (next: ReservationDto[]) => void;       // parent stays in sync
  onAddressTab: () => void;                              // jump to addresses tab
};

type View = "active" | "expired";

export default function BasketTab({
  reservations,
  addresses,
  apiCall,
  onChange,
  onAddressTab,
}: BasketTabProps) {
  const router = useRouter();

  // BasketProvider keeps its own copy of the basket (for the header badge,
  // shop "in basket" indicators, etc). Mutations here go through apiCall
  // rather than provider.add/remove, so the provider is blind to them
  // unless we tell it. refresh() is a cheap GET that re-syncs.
  //
  // Sync points: after every successful remove, re-add, and checkout.
  // Checkout is the most important — it empties the basket, and the badge
  // would otherwise still show items that are now in the orders tab.
  const { refresh: refreshBasket } = useBasket();

  // Split active / recently-expired from the unified list. The server returns
  // both kinds in a single basket payload — simpler than two endpoints — and
  // the UI flips between them with a tab switch.
  const active  = useMemo(() => reservations.filter(r => r.status === "Active"),  [reservations]);
  const expired = useMemo(() => reservations.filter(r => r.status === "Expired"), [reservations]);

  // Set of inventory ids the customer currently holds an Active reservation
  // on. ExpiredReservations consumes this to distinguish "back in your
  // basket" (re-added via Try Again, or claimed some other way) from
  // "no longer available" (someone else has it / it sold). Both are
  // !canReAdd; only the customer-side context tells them apart, and that
  // context is already in the basket payload so we compute it on the FE.
  const inActiveBasketByInventoryId = useMemo(
    () => new Set(active.map(r => r.inventoryId)),
    [active]
  );

  // Which list is showing. Defaults to active. If expired empties out
  // while the customer is on it (last item re-added or filtered away),
  // bounce back to active so they don't see an empty column.
  const [view, setView] = useState<View>("active");
  useEffect(() => {
    if (view === "expired" && expired.length === 0) setView("active");
  }, [view, expired.length]);

  // Per-item checkbox state. Defaults to all-checked when items first arrive
  // — the typical user came here to check out, not curate.
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  useEffect(() => {
    setChecked(prev => {
      const next: Record<number, boolean> = {};
      for (const r of active) next[r.reservationId] = prev[r.reservationId] ?? true;
      return next;
    });
  }, [active]);

  const checkedItems = active.filter(r => checked[r.reservationId]);
  const totalCents   = checkedItems.reduce((s, r) => s + r.unitPriceCents, 0);

  // Default address for the address picker. If the customer hasn't set one
  // explicitly, use the first one in the list. Empty addresses → null,
  // checkout button shows "Add an address" instead.
  const defaultAddress = useMemo(
    () => addresses.find(a => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );
  const [addressId, setAddressId] = useState<number | null>(defaultAddress?.addressId ?? null);
  useEffect(() => {
    if (addressId === null && defaultAddress) setAddressId(defaultAddress.addressId);
  }, [defaultAddress, addressId]);

  // Action state — checkout, per-item remove, per-item re-add.
  const [submitting, setSubmitting]   = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busyId, setBusyId]           = useState<number | null>(null);

  /* ── Remove ── */
  const removeItem = async (id: number) => {
    setBusyId(id);
    setGlobalError(null);
    try {
      const res = await apiCall(`/customers/me/basket/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const updated: ReservationDto = await res.json();
      // Replace the row in-place so it transitions from active → expired
      // without a refetch. Server is the source of truth on canReAdd.
      onChange(reservations.map(r => r.reservationId === id ? updated : r));
      // Tell the provider — header badge would otherwise still count this item.
      // Fire-and-forget; the badge is allowed to lag a heartbeat behind.
      refreshBasket().catch(() => { /* badge stays stale until next nav; not fatal */ });
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Couldn't remove that item.");
    } finally {
      setBusyId(null);
    }
  };

  /* ── Re-add ── */
  const reAddItem = async (id: number) => {
    setBusyId(id);
    setGlobalError(null);
    try {
      const res = await apiCall(`/customers/me/basket/${id}/re-add`, { method: "POST" });
      if (!res.ok) {
        // 409 → someone else has it now, or it sold. Surface the message.
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const created: ReservationDto = await res.json();
      // The expired row stays in the list as audit history. Once `created`
      // is appended, ExpiredReservations sees the matching inventoryId in
      // the active set and re-renders the old row as "Back in your basket"
      // automatically — no need to filter or modify the expired entry.
      onChange([...reservations, created]);
      // New active reservation → bump the badge.
      refreshBasket().catch(() => { /* see removeItem note */ });
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Couldn't add that piece back.");
    } finally {
      setBusyId(null);
    }
  };

  /* ── Checkout ── */
  const checkout = async () => {
    setGlobalError(null);

    if (checkedItems.length === 0) {
      setGlobalError("Tick at least one piece to check out.");
      return;
    }
    if (addressId === null) {
      setGlobalError("Add a shipping address before checking out.");
      onAddressTab();
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiCall("/checkout", {
        method: "POST",
        body:   JSON.stringify({
          reservationIds: checkedItems.map(r => r.reservationId),
          addressId,
          customerNotes:  null,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const order = await res.json() as { orderId: number; squarePaymentLinkUrl: string | null };

      // Checkout converts active reservations into an order — the basket
      // is now (largely) empty server-side. Refresh BEFORE navigating so
      // the header badge updates before the page changes; await it so the
      // Square redirect doesn't race past the GET.
      await refreshBasket().catch(() => { /* see removeItem note */ });

      // Square payment link lives on the order. Route the customer to
      // Square if we have one; if the link generation failed (handler
      // logged a non-fatal warning) the orders tab still shows the
      // PaymentPending state and the customer can retry from there.
      if (order.squarePaymentLinkUrl) {
        window.location.href = order.squarePaymentLinkUrl;
      } else {
        router.push(`/account?tab=orders&placed=${order.orderId}`);
      }
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Checkout failed. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Empty state ── */
  if (active.length === 0 && expired.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="ll-display text-2xl italic mb-3" style={{ color: "var(--ink-soft)" }}>
          Your basket is empty
        </p>
        <p className="ll-body mb-6 text-sm font-light" style={{ color: "var(--ink-soft)" }}>
          Browse the collection and add pieces you&apos;d like to consider.
        </p>
        <Link href="/shop" className="btn-primary">Browse the Collection →</Link>
      </div>
    );
  }

  /* ── Layout: list on the left, sticky checkout panel on the right ── */
  return (
    <div className="grid gap-12 md:grid-rows-[1fr_360px] md:items-start">
      <div>
        {/* ── View switch — only render when there's an expired list to
              switch to. With nothing expired, the active view stands alone
              and the tab control would be visual noise. ─────────────── */}
        {expired.length > 0 && (
          <div className="mb-6 flex gap-6" style={{ borderBottom: "1px solid var(--linen)" }}>
            <ViewTab
              label="Active"
              count={active.length}
              selected={view === "active"}
              onClick={() => setView("active")}
            />
            <ViewTab
              label="Expired"
              count={expired.length}
              selected={view === "expired"}
              onClick={() => setView("expired")}
            />
          </div>
        )}

        {view === "active" ? (
          <ActiveReservations
            active={active}
            checked={checked}
            busyId={busyId}
            submitting={submitting}
            onCheckChange={(id, val) => setChecked(c => ({ ...c, [id]: val }))}
            onRemove={removeItem}
          />
        ) : (
          <ExpiredReservations
            expired={expired}
            inActiveBasket={inActiveBasketByInventoryId}
            busyId={busyId}
            onReAdd={reAddItem}
          />
        )}
      </div>

      {/* Checkout panel only matters when there's something to check out.
          Hidden when active is empty — even if the customer is browsing
          the EXPIRED tab, an empty basket means nothing to send to Square. */}
      {active.length > 0 && (
        <CheckoutPanel
          checkedItems={checkedItems}
          totalCents={totalCents}
          addresses={addresses}
          addressId={addressId}
          onAddressChange={setAddressId}
          onAddressTab={onAddressTab}
          submitting={submitting}
          globalError={globalError}
          onCheckout={checkout}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Inline tab control. Small enough to keep co-located — pulling
   it into its own file would cost more than it saves. Visual
   parity with the rest of the account tab strip (bottom border
   on the selected one, label uppercase, count in parens).
───────────────────────────────────────────────────────────── */
function ViewTab({
  label,
  count,
  selected,
  onClick,
}: {
  label:    string;
  count:    number;
  selected: boolean;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ll-label py-3 text-[0.62rem] uppercase tracking-[0.18em]"
      style={{
        color:        selected ? "var(--rose-deep)" : "var(--ink-soft)",
        background:   "none",
        border:       "none",
        borderBottom: selected ? "2px solid var(--rose-deep)" : "2px solid transparent",
        cursor:       "pointer",
        marginBottom: "-1px", // overlap the parent borderBottom for a clean join
      }}
      aria-pressed={selected}
    >
      {label} <span style={{ opacity: 0.6 }}>({count})</span>
    </button>
  );
}