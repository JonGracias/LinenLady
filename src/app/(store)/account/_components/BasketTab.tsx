// src/app/(store)/account/_components/BasketTab.tsx
//
// Orchestrator for the basket UI. Used by /basket (standalone page,
// reachable signed-out) AND historically by /account?tab=basket — the
// latter no longer renders this in Phase 1 but the component is kept
// at this path because the dumb children (ActiveReservations, etc.)
// live in the same directory.
//
// What changed in the Phase 1 lift:
//   - All data + mutations now come from useCustomerSession(). The old
//     prop-drilled `reservations` / `addresses` / `apiCall` / `onChange`
//     are gone.
//   - Anonymous-mode rendering added. When signed-out, the user sees their
//     localStorage-held items as a simplified list (no Expired tab, no
//     server-side reservation ids) and a "Sign in to Check Out" CTA that
//     bounces them through Clerk and back to /basket.
//   - Customers without a saved address no longer get bounced to
//     /account?tab=address at checkout time. CheckoutPanel handles address
//     creation inline via InlineAddressForm; the onAddressTab prop is
//     gone. /account is still the home for editing/deleting addresses,
//     just not for creating one mid-checkout.
//
// Layout note (changed): the two-row grid below used to be
// `md:grid-rows-[1fr_360px]`. The hard 360px on the second row — the one
// holding CheckoutPanel — meant that when InlineAddressForm expanded, the
// panel's content grew past the track and overflowed it; the footer, as
// the next thing in document flow, painted right at the 360px line and
// the form appeared to slide "under" it. Changed to `1fr_auto` so the
// row sizes to its content and the page grows normally when the form
// opens. Applied to AnonymousBasket too, to keep the two layouts in sync.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useCustomerSession } from "@/context/CustomerSessionContext";
import ActiveReservations from "./basket/ActiveReservations";
import ExpiredReservations from "./basket/ExpiredReservations";
import CheckoutPanel from "./basket/CheckoutPanel";
import OrdersTab from "./OrdersTab";
import { useStorefrontContext } from "@/context/StorefrontContext";

type View = "active" | "expired" | "orders";

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────── */

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/* ─────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────── */

export default function BasketTab() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: authLoaded } = useUser();

  const {
    reservations,
    addresses,
    orders,
    items: pendingItems,          // for anonymous mode rendering
    removeReservation,
    reAddReservation,
    checkout: doCheckout,
    notesDraft,
    remove: removeAnonymous,
  } = useCustomerSession();

  const { getThumbnailUrl, ensureThumbnail } = useStorefrontContext();

  
  /* ── Signed-in derived state ─────────────────────────────────────── */
  
  // Split active / recently-expired from the unified list. The server returns
  // both kinds in a single basket payload — simpler than two endpoints — and
  // the UI flips between them with a tab switch.
  const active  = useMemo(() => reservations.filter(r => r.status === "Active"),  [reservations]);
  const expired = useMemo(() => reservations.filter(r => r.status === "Expired"), [reservations]);

  useEffect(() => {
    active.forEach(r => ensureThumbnail(r.inventoryId));
  }, [active, ensureThumbnail]);
  
  // Set of inventory ids the customer currently holds an Active reservation
  // on. ExpiredReservations consumes this to distinguish "back in your
  // basket" from "no longer available".
  const inActiveBasketByInventoryId = useMemo(
    () => new Set(active.map(r => r.inventoryId)),
    [active]
  );

  // Set of inventory ids the customer has tied up in their own
  // PaymentPending orders. When the customer starts checkout but doesn't
  // finish, the reservation row gets flipped to Expired AND an OrderItem
  // is created against a PaymentPending Order — so the piece appears
  // both in the Expired list (with canReAdd: true from the server's
  // perspective, since the inventory IS available) AND in the customer's
  // own pending order. Without this awareness the Expired row labels it
  // "Still available" and the TRY AGAIN button silently 409s because
  // the server refuses to issue a second hold on the same item to the
  // same customer.
  const inPendingPaymentByInventoryId = useMemo(() => {
    const s = new Set<number>();
    for (const o of orders) {
      if (o.status !== "PaymentPending") continue;
      for (const i of o.items) s.add(i.inventoryId);
    }
    return s;
  }, [orders]);

  // Which sub-view is showing. URL-DRIVEN — derived fresh from searchParams
  // every render rather than held in useState.
  //
  // Why: a local useState gets reset to its initial value whenever
  // BasketTab unmounts and remounts. Next.js's RSC cache can invalidate
  // independently of any user action (e.g. on Clerk auth-refresh events
  // that trigger a server-component re-render), so even though the URL
  // hasn't changed the component can remount. With state-driven view,
  // that remount snapped the customer back to the Active tab even if
  // they were reading Expired or Orders. URL-driven view survives
  // remounts because the URL is the source of truth.
  //
  // (The same remount problem is why the inline-address-form draft now
  // lives in CustomerSessionContext rather than in CheckoutPanel /
  // InlineAddressForm local state — see those files' headers.)
  //
  // For unknown/missing tab values we default to "active" — most common
  // landing intent (customer clicked the basket icon, wanting to check out).
  const view: View = (() => {
    const t = searchParams?.get("tab");
    if (t === "expired" || t === "orders") return t;
    return "active";
  })();

  // URL-write helper for tab clicks. Uses replace (not push) so the
  // browser back button still does what the customer expects: takes them
  // back to wherever they came from, not through every tab they clicked.
  // scroll: false keeps the page from jumping to top on tab change.
  const setView = (next: View) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "active") {
      params.delete("tab"); // canonical URL for the default tab
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(qs ? `/basket?${qs}` : "/basket", { scroll: false });
  };

  // Bounce away from "expired" if it empties out (the only sub-view that
  // can become empty while the customer is on it). Orders doesn't auto-
  // bounce — an empty Orders list is a meaningful state ("you've never
  // placed an order") and we render an empty-state inside OrdersTab.
  useEffect(() => {
    if (view === "expired" && expired.length === 0) {
      setView("active");
    }
    // setView is stable (it closes over router + searchParams, both stable
    // references from Next.js's navigation hooks for the lifetime of the
    // page). Excluding it from deps is intentional — including it would
    // require useCallback which is overkill for a derived helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, expired.length]);

  // Highlighted order id for the OrdersTab sub-view. Comes from the
  // post-checkout redirect (?placed=N) and feeds OrdersTab's existing
  // `highlight` prop, which expands that row by default.
  const placedOrderId = useMemo(() => {
    const r = searchParams?.get("placed");
    if (!r) return null;
    const n = Number.parseInt(r, 10);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

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

  // Default address for the picker. If none exists yet, the checkout button
  // shows "Add an address" instead and routes to /account?tab=address.
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

  /* ── Signed-in mutations (delegate to session context) ───────────── */

  const removeItem = async (id: number) => {
    setBusyId(id);
    setGlobalError(null);
    try {
      const updated = await removeReservation(id);
      if (!updated) throw new Error("Couldn't remove that item.");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Couldn't remove that item.");
    } finally {
      setBusyId(null);
    }
  };

  const reAddItem = async (id: number) => {
    setBusyId(id);
    setGlobalError(null);
    try {
      const created = await reAddReservation(id);
      if (!created) {
        throw new Error(
          "This piece is no longer available — it may have sold or " +
          "been added to someone else's basket."
        );
      }
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Couldn't add that piece back.");
    } finally {
      setBusyId(null);
    }
  };

  const checkout = async () => {
    setGlobalError(null);

    if (checkedItems.length === 0) {
      setGlobalError("Tick at least one piece to check out.");
      return;
    }
    if (addressId === null) {
      // Defense-in-depth: with the new inline-address-form in CheckoutPanel
      // this case shouldn't be reachable (the Check Out button disables
      // when no address is available). Surfacing the error and bailing
      // covers any race where the panel's state machine got into a weird
      // gap. No more redirect to /account — the panel handles address
      // creation inline now.
      setGlobalError("Add a shipping address before checking out.");
      return;
    }

    setSubmitting(true);
    try {
      const trimmedNotes = notesDraft.notes.trim();
      const result = await doCheckout({
        reservationIds: checkedItems.map(r => r.reservationId),
        addressId,
        customerNotes:  trimmedNotes.length > 0 ? trimmedNotes : null,
      });

      if (!result.ok) {
        throw new Error(result.message || "Checkout failed. Try again in a moment.");
      }

      // Square payment link lives on the order. Route the customer to
      // Square if we have one; if the link generation failed (handler
      // logged a non-fatal warning) the orders tab still shows the
      // PaymentPending state and the customer can retry from there.
      if (result.order.squarePaymentLinkUrl) {
        window.location.href = result.order.squarePaymentLinkUrl;
      } else {
        router.push(`/basket?tab=orders&placed=${result.order.orderId}`);
      }
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Checkout failed. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Anonymous mode rendering ────────────────────────────────────── */
  //
  // Signed-out customers don't have server reservations, expired rows,
  // addresses, or checkbox state — and they can't check out. We show a
  // simplified list and route them through Clerk when they hit "Sign in
  // to Check Out". The redirect_url ensures they come back to wherever
  // they were (this component renders at /basket; in principle it could
  // also be embedded elsewhere, so we use the current pathname rather
  // than hard-coding /basket).

  if (authLoaded && !isSignedIn) {
    if (pendingItems.length === 0) {
      // Empty anonymous basket — same shape as the signed-in empty state.
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

    return <AnonymousBasket
      items={pendingItems}
      onRemove={(inventoryId) => { void removeAnonymous(inventoryId); }}
      currentPath={pathname || "/basket"}
    />;
  }

  /* ── Signed-in rendering ─────────────────────────────────────────── */

  /* ── Fully-empty state ──
     A new customer with no basket items, no expired rows, and no orders
     has nothing to do on this page. Show the welcome-to-the-collection
     prompt instead of an empty tab bar. */
  if (active.length === 0 && expired.length === 0 && orders.length === 0) {
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

  /* ── Layout: list on the left, sticky checkout panel on the right ──
     The checkout panel only renders on the Active sub-view when there
     are items in the basket. Expired and Orders sub-views collapse to
     a single-column layout (CSS Grid handles this automatically when
     the second child is absent).

     Row sizing: `md:grid-rows-[1fr_auto]`. The second row (CheckoutPanel)
     is `auto`, not a fixed height — so when InlineAddressForm expands
     inside the panel, the row grows with it and the page gets taller
     normally. A previous fixed `360px` here let the form overflow the
     track and slide visually under the footer. */
  return (
    <div className="grid gap-12 md:grid-rows-[1fr_auto] md:items-start">
      <div>
        {/* ── Sub-view tab bar — always rendered for signed-in customers,
            so Orders is always reachable. The Expired tab hides when
            empty (rare, transient state); Active and Orders are always
            visible because they represent the customer's primary
            engagement modes. */}
        <div className="mb-6 flex gap-6" style={{ borderBottom: "1px solid var(--linen)" }}>
          <ViewTab
            label="Active"
            count={active.length}
            selected={view === "active"}
            onClick={() => setView("active")}
          />
          {expired.length > 0 && (
            <ViewTab
              label="Expired"
              count={expired.length}
              selected={view === "expired"}
              onClick={() => setView("expired")}
            />
          )}
          <ViewTab
            label="Orders"
            count={orders.length}
            selected={view === "orders"}
            onClick={() => setView("orders")}
          />
        </div>

        {view === "active" ? (
          <ActiveReservations
            active={active}
            checked={checked}
            busyId={busyId}
            submitting={submitting}
            onCheckChange={(id, val) => setChecked(c => ({ ...c, [id]: val }))}
            onRemove={removeItem}
            getThumbnailUrl={getThumbnailUrl} 
          />
        ) : view === "expired" ? (
          <ExpiredReservations
            expired={expired}
            inActiveBasket={inActiveBasketByInventoryId}
            inPendingPayment={inPendingPaymentByInventoryId}
            busyId={busyId}
            onReAdd={reAddItem}
          />
        ) : (
          /* Orders sub-view. Reuses the existing OrdersTab component
             unchanged — it already handles the highlight-row-from-?placed
             flow, the per-status pills, the expand-on-click rows. */
          <OrdersTab
            orders={orders}
            highlight={placedOrderId}
          />
        )}
      </div>

      {view === "active" && active.length > 0 && (
        <CheckoutPanel
          checkedItems={checkedItems}
          totalCents={totalCents}
          addresses={addresses}
          addressId={addressId}
          onAddressChange={setAddressId}
          submitting={submitting}
          globalError={globalError}
          onCheckout={checkout}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Anonymous-mode basket view.
   
   Renders the localStorage items as a simple list with remove buttons
   and a "Sign in to Check Out" CTA. No server-side concerns — no
   reservations, no addresses, no checkboxes. The sign-in flow's
   redirect_url brings the customer back here, at which point the
   session context's auth-transition effect replays their items into
   server-held reservations and the page re-renders in signed-in mode.
───────────────────────────────────────────────────────────── */
function AnonymousBasket({
  items,
  onRemove,
  currentPath,
}: {
  items:        { inventoryId: number; sku: string; name: string; unitPriceCents: number; thumbnailUrl: string | null }[];
  onRemove:     (inventoryId: number) => void;
  currentPath:  string;
}) {
  const totalCents = items.reduce((s, i) => s + i.unitPriceCents, 0);
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`;
  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(currentPath)}`;

  

  return (
    // Same `md:grid-rows-[1fr_auto]` as the signed-in layout. This panel
    // can't expand a form today, but keeping the two layouts identical
    // means a future addition here won't silently reintroduce the
    // fixed-height overflow bug.
    <div className="grid gap-12 md:grid-rows-[1fr_auto] md:items-start">
      {/* ── Item list ── */}
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="ll-display text-xl font-normal" style={{ color: "var(--ink)" }}>
            In your <em className="italic" style={{ color: "var(--rose-deep)" }}>basket</em>
          </h2>
          <p className="ll-label text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--ink-soft)" }}>
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.inventoryId}
              className="flex items-center gap-4 border p-4"
              style={{ borderColor: "var(--linen)", background: "var(--cream-dark)" }}
            >
              {/* Thumbnail */}
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "0.2rem",
                  background: "var(--linen)",
                }}
              >
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              {/* Title + price */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${item.sku}`}
                  className="ll-display block text-base font-normal truncate"
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                >
                  {item.name}
                </Link>
                <p
                  className="ll-label text-[0.62rem] uppercase tracking-[0.12em] mt-1"
                  style={{ color: "var(--rose-deep)" }}
                >
                  {formatPrice(item.unitPriceCents)}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => onRemove(item.inventoryId)}
                className="ll-label text-[0.6rem] uppercase tracking-[0.12em] underline"
                style={{
                  color: "var(--ink-soft)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label={`Remove ${item.name} from basket`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sign-in CTA panel ── */}
      <div
        className="sticky top-6 p-6"
        style={{
          background:   "var(--cream-dark)",
          borderRadius: "0.25rem",
          outline:      "1px solid var(--linen)",
        }}
      >
        <p
          className="ll-label mb-4 text-[0.6rem] uppercase tracking-[0.2em]"
          style={{ color: "var(--ink-soft)" }}
        >
          Summary
        </p>

        <div className="flex items-baseline justify-between mb-6">
          <span className="ll-body text-sm font-light" style={{ color: "var(--ink-soft)" }}>
            Subtotal
          </span>
          <span className="ll-display text-lg font-normal" style={{ color: "var(--ink)" }}>
            {formatPrice(totalCents)}
          </span>
        </div>

        <p
          className="ll-body mb-5 text-xs font-light leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          Sign in or create an account to reserve these pieces and check out.
          Heritage linens are one of a kind — signing in places a hold so
          another customer doesn&apos;t take a piece while you decide.
        </p>

        <Link
          href={signInHref}
          className="ll-label block w-full py-3 text-center text-[0.65rem] font-medium uppercase tracking-[0.15em] text-white"
          style={{
            background:     "var(--rose-deep)",
            border:         "none",
            cursor:         "pointer",
            textDecoration: "none",
          }}
        >
          Sign in to Check Out
        </Link>

        <Link
          href={signUpHref}
          className="ll-label block w-full py-3 mt-2 text-center text-[0.6rem] uppercase tracking-[0.12em]"
          style={{
            background:     "none",
            border:         "1px solid var(--linen)",
            color:          "var(--ink-soft)",
            textDecoration: "none",
          }}
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Inline tab control — same as before.
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
        marginBottom: "-1px",
      }}
      aria-pressed={selected}
    >
      {label} <span style={{ opacity: 0.6 }}>({count})</span>
    </button>
  );
}
