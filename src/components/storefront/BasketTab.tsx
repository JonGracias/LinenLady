// src/app/(store)/account/_components/BasketTab.tsx
// Basket UI for signed-in and anonymous customers.
// Signed-in state comes from CustomerSessionContext; anonymous items stay local until sign-in.

"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useCustomerSession } from "@/context/CustomerSessionContext";
import ActiveReservations from "./ActiveReservations";
import ExpiredReservations from "./ExpiredReservations";
import CheckoutPanel from "./CheckoutPanel";
import OrdersTab from "./OrdersTab";
import { useStorefrontContext } from "@/context/StorefrontContext";
import { formatPrice } from "@/lib/utils";

type View = "active" | "expired" | "orders";

type AnonymousBasketItem = {
  inventoryId: number;
  sku: string;
  name: string;
  unitPriceCents: number;
  thumbnailUrl: string | null;
};

export default function BasketTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: authLoaded } = useUser();

  const {
    reservations,
    addresses,
    orders,
    items: pendingItems,
    removeReservation,
    reAddReservation,
    checkout: doCheckout,
    notesDraft,
    remove: removeAnonymous,
  } = useCustomerSession();

  const { getThumbnailUrl, ensureThumbnail } = useStorefrontContext();

  const active = useMemo(
    () => reservations.filter(r => r.status === "Active"),
    [reservations]
  );
  const expired = useMemo(
    () => reservations.filter(r => r.status === "Expired"),
    [reservations]
  );

  // Prefetch thumbnails for every surface that renders one — active and
  // expired reservations plus all order line items. Previously this only
  // covered `active`, which is why ExpiredReservations and OrdersTab fell
  // back to the (always-null) DTO thumbnailUrl and showed blank boxes.
  useEffect(() => {
    active.forEach(r => ensureThumbnail(r.inventoryId));
    expired.forEach(r => ensureThumbnail(r.inventoryId));
    orders.forEach(o => o.items.forEach(i => ensureThumbnail(i.inventoryId)));
  }, [active, expired, orders, ensureThumbnail]);

  const inActiveBasketByInventoryId = useMemo(
    () => new Set(active.map(r => r.inventoryId)),
    [active]
  );

  // Items in PaymentPending orders cannot be re-held by the same customer.
  const inPendingPaymentByInventoryId = useMemo(() => {
    const s = new Set<number>();
    for (const o of orders) {
      if (o.status !== "PaymentPending") continue;
      for (const i of o.items) s.add(i.inventoryId);
    }
    return s;
  }, [orders]);

  // URL-driven so the selected tab survives remounts/RSC refreshes.
  const view: View = (() => {
    const t = searchParams?.get("tab");
    return t === "expired" || t === "orders" ? t : "active";
  })();

  const setView = (next: View) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "active") params.delete("tab");
    else params.set("tab", next);

    const qs = params.toString();
    router.replace(qs ? `/basket?${qs}` : "/basket", { scroll: false });
  };

  useEffect(() => {
    if (view === "expired" && expired.length === 0) setView("active");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, expired.length]);

  const placedOrderId = useMemo(() => {
    const r = searchParams?.get("placed");
    if (!r) return null;

    const n = Number.parseInt(r, 10);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [checked, setChecked] = useState<Record<number, boolean>>({});
  useEffect(() => {
    setChecked(prev => {
      const next: Record<number, boolean> = {};
      for (const r of active) next[r.reservationId] = prev[r.reservationId] ?? true;
      return next;
    });
  }, [active]);

  const checkedItems = active.filter(r => checked[r.reservationId]);
  const totalCents = checkedItems.reduce((s, r) => s + r.unitPriceCents, 0);

  const defaultAddress = useMemo(
    () => addresses.find(a => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );
  const [addressId, setAddressId] = useState<number | null>(defaultAddress?.addressId ?? null);
  useEffect(() => {
    if (addressId === null && defaultAddress) setAddressId(defaultAddress.addressId);
  }, [defaultAddress, addressId]);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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
      setGlobalError("Add a shipping address before checking out.");
      return;
    }

    setSubmitting(true);

    try {
      const trimmedNotes = notesDraft.notes.trim();
      const result = await doCheckout({
        reservationIds: checkedItems.map(r => r.reservationId),
        addressId,
        customerNotes: trimmedNotes.length > 0 ? trimmedNotes : null,
      });

      if (!result.ok) {
        throw new Error(result.message || "Checkout failed. Try again in a moment.");
      }

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

  if (authLoaded && !isSignedIn) {
    if (pendingItems.length === 0) return <EmptyBasket />;

    return (
      <AnonymousBasket
        items={pendingItems}
        onRemove={(inventoryId) => { void removeAnonymous(inventoryId); }}
        currentPath={pathname || "/basket"}
      />
    );
  }

  if (active.length === 0 && expired.length === 0 && orders.length === 0) {
    return <EmptyBasket />;
  }

  return (
    <BasketLayout>
      <div>
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
            getThumbnailUrl={getThumbnailUrl}
          />
        ) : (
          <OrdersTab orders={orders} highlight={placedOrderId} getThumbnailUrl={getThumbnailUrl} />
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
    </BasketLayout>
  );
}

function BasketLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-12 md:grid-rows-[1fr_auto] md:items-start">
      {children}
    </div>
  );
}

function EmptyBasket() {
  return (
    <div className="py-16 text-center">
      <p className="ll-display text-2xl italic mb-3" style={{ color: "var(--ink-soft)" }}>
        Your basket is empty
      </p>
      <p className="ll-body mb-6 text-sm font-light" style={{ color: "var(--ink-soft)" }}>
        Browse the collection and add pieces you&apos;d like to consider.
      </p>
      <Link href="/shop" className="btn-primary">
        Browse the Collection →
      </Link>
    </div>
  );
}

function AnonymousBasket({
  items,
  onRemove,
  currentPath,
}: {
  items: AnonymousBasketItem[];
  onRemove: (inventoryId: number) => void;
  currentPath: string;
}) {
  const totalCents = items.reduce((s, i) => s + i.unitPriceCents, 0);
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`;
  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(currentPath)}`;

  return (
    <BasketLayout>
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
          {items.map(item => (
            <div
              key={item.inventoryId}
              className="flex items-center gap-4 border p-4"
              style={{ borderColor: "var(--linen)", background: "var(--cream-dark)" }}
            >
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

      <div
        className="sticky top-6 p-6"
        style={{
          background: "var(--cream-dark)",
          borderRadius: "0.25rem",
          outline: "1px solid var(--linen)",
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
            background: "var(--rose-deep)",
            border: "none",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          Sign in to Check Out
        </Link>

        <Link
          href={signUpHref}
          className="ll-label block w-full py-3 mt-2 text-center text-[0.6rem] uppercase tracking-[0.12em]"
          style={{
            background: "none",
            border: "1px solid var(--linen)",
            color: "var(--ink-soft)",
            textDecoration: "none",
          }}
        >
          Create an Account
        </Link>
      </div>
    </BasketLayout>
  );
}

function ViewTab({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ll-label py-3 text-[0.62rem] uppercase tracking-[0.18em]"
      style={{
        color: selected ? "var(--rose-deep)" : "var(--ink-soft)",
        background: "none",
        border: "none",
        borderBottom: selected ? "2px solid var(--rose-deep)" : "2px solid transparent",
        cursor: "pointer",
        marginBottom: "-1px",
      }}
      aria-pressed={selected}
    >
      {label} <span style={{ opacity: 0.6 }}>({count})</span>
    </button>
  );
}