// src/app/(store)/account/_components/BasketTab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReservationDto, CustomerAddressDto } from "@/types/customer";
import { useBasket } from "@/context/BasketContext";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h remaining`;
  }
  return `${h}h ${m}m remaining`;
}

/* ─────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────── */

type BasketTabProps = {
  reservations: ReservationDto[];
  addresses:    CustomerAddressDto[];
  apiCall:      (path: string, opts?: RequestInit) => Promise<Response>;
  onChange:     (next: ReservationDto[]) => void;       // parent stays in sync
  onAddressTab: () => void;                              // jump to addresses tab
};

/* ─────────────────────────────────────────────────────────────
   Tab body
───────────────────────────────────────────────────────────── */

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
  // the UI splits them into two visual sections.
  const active  = useMemo(() => reservations.filter(r => r.status === "Active"),  [reservations]);
  const expired = useMemo(() => reservations.filter(r => r.status === "Expired"), [reservations]);

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
  const [submitting, setSubmitting]     = useState(false);
  const [globalError, setGlobalError]   = useState<string | null>(null);
  const [busyId, setBusyId]             = useState<number | null>(null);

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
      // The expired row stays (audit), the new active row is appended.
      onChange([...reservations, created]);
      // New active reservation → bump the badge.
      refreshBasket().catch(() => { /* see removeItem note */ });
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Couldn't add that piece back.");
    } finally {
      setBusyId(null);
    }
  };

  /* ── Ask Noemi ── */
  const askNoemi = async (reservationId: number) => {
    setBusyId(reservationId);
    setGlobalError(null);
    try {
      const res = await apiCall("/customers/me/ask-noemi", {
        method: "POST",
        body:   JSON.stringify({ reservationId, openingQuestion: null }),
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      router.push("/account?tab=messages");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Couldn't open a message thread.");
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

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_360px] md:items-start">

      {/* ── Active items (the basket proper) ───────────────────── */}
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
            In your <em className="italic" style={{ color: "var(--rose-deep)" }}>basket</em>
          </h2>
          <p className="ll-label text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
            {active.length} {active.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {active.length === 0 ? (
          <p className="ll-body py-8 text-sm italic" style={{ color: "var(--ink-soft)" }}>
            Nothing currently held — see your recently-expired pieces below.
          </p>
        ) : (
          <ul className="flex flex-col" style={{ borderTop: "1px solid var(--linen)" }}>
            {active.map(r => (
              <li
                key={r.reservationId}
                className="flex items-center gap-4 py-5"
                style={{ borderBottom: "1px solid var(--linen)" }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={checked[r.reservationId] ?? false}
                  onChange={(e) => setChecked(c => ({ ...c, [r.reservationId]: e.target.checked }))}
                  disabled={submitting}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-[color:var(--rose-deep)]"
                  aria-label={`Include ${r.itemName ?? "item"} in checkout`}
                />

                {/* Thumb */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{ width: 64, height: 64, borderRadius: "0.2rem", background: "var(--cream-dark)" }}
                >
                  {r.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnailUrl} alt={r.itemName ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center ll-display text-[0.5rem] italic"
                         style={{ color: "var(--ink-soft)" }}>LL</div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${r.itemSku ?? ""}`}
                    className="ll-display text-sm font-normal leading-snug line-clamp-2 hover:opacity-60"
                    style={{ color: "var(--ink)", textDecoration: "none" }}
                  >
                    {r.itemName ?? "Linen Lady piece"}
                  </Link>
                  <p className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
                    {timeLeft(r.expiresAt)}
                  </p>
                </div>

                {/* Price + actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="ll-display text-sm font-normal" style={{ color: "var(--rose-deep)" }}>
                    {formatPrice(r.unitPriceCents)}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => askNoemi(r.reservationId)}
                      disabled={busyId === r.reservationId || submitting}
                      className="ll-label text-[0.55rem] uppercase tracking-[0.1em] hover:opacity-60 disabled:opacity-30"
                      style={{ color: "var(--sage-deep)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Ask Noemi
                    </button>
                    <button
                      onClick={() => removeItem(r.reservationId)}
                      disabled={busyId === r.reservationId || submitting}
                      className="ll-label text-[0.55rem] uppercase tracking-[0.1em] hover:opacity-60 disabled:opacity-30"
                      style={{ color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer" }}
                      aria-label={`Remove ${r.itemName ?? "item"}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Recently expired ─────────────────────────────────── */}
        {expired.length > 0 && (
          <div className="mt-12">
            <h3 className="ll-label mb-4 text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
              Recently expired
            </h3>
            <ul className="flex flex-col" style={{ borderTop: "1px solid var(--linen)" }}>
              {expired.map(r => (
                <li
                  key={r.reservationId}
                  className="flex items-center gap-4 py-4 opacity-70"
                  style={{ borderBottom: "1px solid var(--linen)" }}
                >
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{ width: 48, height: 48, borderRadius: "0.2rem", background: "var(--cream-dark)" }}
                  >
                    {r.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumbnailUrl} alt={r.itemName ?? ""} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ll-display text-sm font-normal" style={{ color: "var(--ink)" }}>
                      {r.itemName ?? "Linen Lady piece"}
                    </p>
                    <p className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
                      {r.canReAdd ? "Still available" : "No longer available"}
                    </p>
                  </div>
                  <span className="ll-display text-xs" style={{ color: "var(--ink-soft)" }}>
                    {formatPrice(r.unitPriceCents)}
                  </span>
                  <button
                    onClick={() => reAddItem(r.reservationId)}
                    disabled={!r.canReAdd || busyId === r.reservationId}
                    className="ll-label text-[0.6rem] uppercase tracking-[0.1em] hover:opacity-60 disabled:opacity-30"
                    style={{ color: "var(--sage-deep)", background: "none", border: "none", cursor: r.canReAdd ? "pointer" : "not-allowed" }}
                  >
                    Try Again
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Summary + checkout panel (sticky) ──────────────────── */}
      {active.length > 0 && (
        <div
          className="sticky top-6 p-6"
          style={{
            background:   "var(--cream-dark)",
            borderRadius: "0.25rem",
            outline:      "1px solid var(--linen)",
          }}
        >
          <p className="ll-label mb-4 text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
            Summary
          </p>

          {/* Selected items */}
          <div className="mb-5 flex flex-col gap-2">
            {checkedItems.length === 0 ? (
              <p className="ll-body text-xs italic" style={{ color: "var(--ink-soft)" }}>
                No pieces selected yet.
              </p>
            ) : checkedItems.map(r => (
              <div key={r.reservationId} className="flex items-baseline justify-between gap-4">
                <span className="ll-body truncate text-xs font-light" style={{ color: "var(--ink-soft)" }}>
                  {r.itemName}
                </span>
                <span className="ll-label shrink-0 text-[0.62rem]" style={{ color: "var(--ink)" }}>
                  {formatPrice(r.unitPriceCents)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mb-5 flex items-baseline justify-between pt-4" style={{ borderTop: "1px solid var(--linen)" }}>
            <span className="ll-label text-[0.62rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
              Total
            </span>
            <span className="ll-display text-lg" style={{ color: "var(--rose-deep)" }}>
              {formatPrice(totalCents)}
            </span>
          </div>

          {/* Address picker — falls back to a "set one" prompt when empty */}
          <div className="mb-5">
            <label className="ll-label mb-2 block text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: "var(--ink-soft)" }}>
              Ship to
            </label>
            {addresses.length === 0 ? (
              <button
                onClick={onAddressTab}
                className="ll-body w-full p-3 text-left text-xs italic"
                style={{
                  background:  "var(--cream)",
                  border:      "1px dashed var(--linen)",
                  color:       "var(--rose-deep)",
                  cursor:      "pointer",
                }}
              >
                + Add a shipping address
              </button>
            ) : (
              <select
                value={addressId ?? ""}
                onChange={(e) => setAddressId(Number(e.target.value))}
                disabled={submitting}
                className="ll-body w-full p-2 text-xs"
                style={{ background: "var(--cream)", border: "1px solid var(--linen)", color: "var(--ink)" }}
              >
                {addresses.map(a => (
                  <option key={a.addressId} value={a.addressId}>
                    {a.label} — {a.street1}, {a.city} {a.state}
                  </option>
                ))}
              </select>
            )}
          </div>

          {globalError && (
            <p role="alert" className="ll-body mb-3 text-xs" style={{ color: "#991b1b" }}>
              {globalError}
            </p>
          )}

          <button
            onClick={checkout}
            disabled={submitting || checkedItems.length === 0 || addresses.length === 0}
            className="btn-primary block w-full py-4 text-center text-[0.65rem] tracking-[0.15em] disabled:opacity-50"
            style={{ border: "none", cursor: submitting ? "wait" : "pointer" }}
          >
            {submitting
              ? "Sending to Square…"
              : checkedItems.length === 0
              ? "Select pieces to check out"
              : checkedItems.length === 1
              ? `Check Out — ${formatPrice(totalCents)} →`
              : `Check Out ${checkedItems.length} Pieces — ${formatPrice(totalCents)} →`}
          </button>

          <p className="ll-body mt-3 text-[0.65rem] italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            You&apos;ll be sent to Square to complete payment. Items remain
            held until checkout completes; if you abandon the form, they&apos;ll
            return to your basket within a day.
          </p>
        </div>
      )}
    </div>
  );
}