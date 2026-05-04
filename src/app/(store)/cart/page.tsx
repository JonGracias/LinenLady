// src/app/(store)/cart/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { useCart } from "@/context/CartContext";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// Per-item reserve status during a multi-reserve submission.
// "ok" = reservation row created server-side; "err" = surfaced to the user.
type ItemStatus = "idle" | "pending" | "ok" | "err";

export default function CartPage() {
  const { items, remove, clear, count } = useCart();
  const { isSignedIn, isLoaded }        = useUser();
  const { getToken }                    = useAuth();
  const router                          = useRouter();

  const [statuses, setStatuses] = useState<Record<number, ItemStatus>>({});
  const [errors,   setErrors]   = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + i.unitPriceCents, 0);

  const okCount = Object.values(statuses).filter((s) => s === "ok").length;
  const allDone = items.length > 0 && items.every(
    (i) => statuses[i.inventoryId] === "ok" || statuses[i.inventoryId] === "err"
  );

  const reserveAll = async () => {
    setGlobalError(null);

    if (!isSignedIn) {
      const here = "/cart";
      router.push(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
      return;
    }

    setSubmitting(true);
    let token: string | null = null;
    try {
      token = await getToken();
    } catch {
      setGlobalError("Could not authenticate. Try signing out and back in.");
      setSubmitting(false);
      return;
    }

    // Sequential submission: server enforces uniqueness per inventory item, so
    // racing them in parallel risks confusing 409 ordering. The cart is small
    // (≤ a handful of items typically) so the latency cost is negligible.
    let anySuccess = false;
    for (const it of items) {
      if (statuses[it.inventoryId] === "ok") continue;

      setStatuses((s) => ({ ...s, [it.inventoryId]: "pending" }));

      try {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({
            inventoryId:   it.inventoryId,
            customerNotes: null,
          }),
        });

        if (res.ok) {
          setStatuses((s) => ({ ...s, [it.inventoryId]: "ok" }));
          remove(it.inventoryId);
          anySuccess = true;
          continue;
        }

        // 409 with structured body → customer already reserved this item.
        // Treat it as a success for cart-flow purposes (the reservation
        // exists, that's what the user wanted) and clear it from the cart.
        if (res.status === 409) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const body = await res.json().catch(() => null) as
              | { reason?: string } | null;
            if (body?.reason === "already_reserved_by_you") {
              setStatuses((s) => ({ ...s, [it.inventoryId]: "ok" }));
              remove(it.inventoryId);
              anySuccess = true;
              continue;
            }
          }
        }

        const text = await res.text().catch(() => "");
        setStatuses((s) => ({ ...s, [it.inventoryId]: "err" }));
        setErrors((e) => ({
          ...e,
          [it.inventoryId]: text || `HTTP ${res.status}`,
        }));
      } catch (e) {
        setStatuses((s) => ({ ...s, [it.inventoryId]: "err" }));
        setErrors((e2) => ({
          ...e2,
          [it.inventoryId]: e instanceof Error ? e.message : "Network error",
        }));
      }
    }

    setSubmitting(false);

    // If everything succeeded, jump straight to the reservation list — saves
    // the user a click and matches the single-item flow's behavior.
    const remainingErrors = items.some(
      (i) => statuses[i.inventoryId] === "err"
    );
    if (anySuccess && !remainingErrors) {
      router.push(`/account?tab=reservations&reserved=cart`);
    }
  };

  /* ── Empty state ── */
  if (count === 0 && okCount === 0) {
    return (
      <div
        className="ll-texture-overlay min-h-[60vh] flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "var(--surface)", color: "var(--on-surface)" }}
      >
        <p
          className="ll-display text-3xl font-normal italic mb-3"
          style={{ color: "var(--on-surface-variant)", letterSpacing: "-0.01em" }}
        >
          Your list is empty
        </p>
        <p className="ll-body text-base font-light mb-8" style={{ color: "var(--outline)" }}>
          Browse the collection and add pieces you&apos;re interested in.
        </p>
        <Link href="/shop" className="btn-primary">
          Browse the Collection →
        </Link>
      </div>
    );
  }

  /* ── Success summary (all items reserved) ── */
  if (count === 0 && okCount > 0) {
    return (
      <div
        className="ll-texture-overlay min-h-[60vh] flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "var(--surface)", color: "var(--on-surface)" }}
      >
        <p
          className="ll-label mb-2 text-[0.62rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--primary)" }}
        >
          Reservations Sent
        </p>
        <p
          className="ll-display text-2xl font-normal italic mb-4"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
        >
          {okCount === 1 ? "One piece" : `${okCount} pieces`} reserved
        </p>
        <p className="ll-body mb-8 max-w-md text-base font-light leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
          Noemi will follow up shortly. You can track each reservation and reply to her under{" "}
          <Link href="/account?tab=messages" style={{ color: "var(--primary)" }}>Messages</Link>{" "}in your account.
        </p>
        <div className="flex gap-3">
          <Link href="/account?tab=reservations" className="btn-primary">
            View My Reservations →
          </Link>
          <Link
            href="/shop"
            className="ll-label inline-block py-3 px-6 text-[0.62rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Keep Browsing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ll-texture-overlay min-h-screen"
      style={{ background: "var(--surface)", color: "var(--on-surface)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 md:px-10 pt-10 pb-6"
        style={{ borderBottom: "1px solid rgba(196,181,168,0.15)" }}
      >
        <p
          className="ll-label mb-2 text-[0.6rem] font-medium uppercase tracking-[0.25em]"
          style={{ color: "var(--primary)" }}
        >
          Your Selection
        </p>
        <h1
          className="ll-display font-normal leading-tight"
          style={{ fontSize: "clamp(1.8rem, 3vw, 3rem)", color: "var(--on-surface)", letterSpacing: "-0.01em" }}
        >
          Reservation{" "}
          <em className="italic" style={{ color: "var(--primary)" }}>List</em>
        </h1>
        <p className="ll-body mt-2 text-sm font-light" style={{ color: "var(--on-surface-variant)" }}>
          {count} {count === 1 ? "piece" : "pieces"} selected
        </p>
      </div>

      <div className="px-6 md:px-10 py-8 md:grid md:gap-12 md:items-start" style={{ gridTemplateColumns: "1fr 360px" }}>

        {/* ── Item list ── */}
        <div className="flex flex-col gap-0" style={{ borderTop: "1px solid rgba(196,181,168,0.15)" }}>
          {items.map((item) => {
            const status = statuses[item.inventoryId] ?? "idle";
            const err    = errors[item.inventoryId];
            return (
              <div
                key={item.inventoryId}
                className="flex items-center gap-5 py-5"
                style={{ borderBottom: "1px solid rgba(196,181,168,0.15)" }}
              >
                {/* Thumbnail */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "0.2rem",
                    background: "var(--surface-container-highest)",
                  }}
                >
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center ll-display text-[0.5rem] italic"
                      style={{ color: "var(--outline-variant)" }}
                    >
                      LL
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${item.sku}`}
                    className="ll-display text-sm font-normal leading-snug line-clamp-2 transition-opacity hover:opacity-60"
                    style={{ color: "var(--on-surface)", textDecoration: "none" }}
                  >
                    {item.name}
                  </Link>
                  <p
                    className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]"
                    style={{ color: "var(--outline)" }}
                  >
                    {item.sku}
                  </p>
                  {status === "err" && err && (
                    <p
                      className="ll-body mt-1 text-[0.7rem] font-light"
                      role="alert"
                      style={{ color: "#991b1b" }}
                    >
                      {err}
                    </p>
                  )}
                  {status === "pending" && (
                    <p
                      className="ll-label mt-1 text-[0.55rem] uppercase tracking-[0.12em]"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      Reserving…
                    </p>
                  )}
                </div>

                {/* Price + remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className="ll-display text-sm font-normal"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatPrice(item.unitPriceCents)}
                  </span>
                  <button
                    onClick={() => remove(item.inventoryId)}
                    disabled={submitting}
                    className="ll-label text-[0.55rem] uppercase tracking-[0.1em] transition-opacity hover:opacity-60 disabled:opacity-30"
                    style={{ color: "var(--on-surface-variant)", background: "none", border: "none", cursor: "pointer" }}
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          {/* Clear all */}
          <button
            onClick={clear}
            disabled={submitting}
            className="ll-label mt-4 self-start text-[0.58rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60 disabled:opacity-30"
            style={{ color: "var(--on-surface-variant)", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear List
          </button>
        </div>

        {/* ── Summary + CTA ── */}
        <div
          className="mt-8 md:mt-0 p-6 md:p-8 sticky top-6"
          style={{
            background:   "var(--surface-bright)",
            borderRadius: "0.25rem",
            outline:      "1px solid rgba(196,181,168,0.2)",
          }}
        >
          {/* Ghost corners */}
          <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2" style={{ borderColor: "var(--primary)", opacity: 0.3 }} />
          <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2" style={{ borderColor: "var(--primary)", opacity: 0.3 }} />

          <p
            className="ll-label mb-4 text-[0.6rem] font-medium uppercase tracking-[0.2em]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Summary
          </p>

          {/* Item lines */}
          <div className="flex flex-col gap-2 mb-5">
            {items.map((item) => (
              <div key={item.inventoryId} className="flex items-baseline justify-between gap-4">
                <span
                  className="ll-body text-xs font-light truncate"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {item.name}
                </span>
                <span
                  className="ll-label text-[0.62rem] shrink-0"
                  style={{ color: "var(--on-surface)" }}
                >
                  {formatPrice(item.unitPriceCents)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            className="flex items-baseline justify-between pt-4 mb-6"
            style={{ borderTop: "1px solid rgba(196,181,168,0.2)" }}
          >
            <span
              className="ll-label text-[0.62rem] font-medium uppercase tracking-[0.12em]"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Total Interest
            </span>
            <span
              className="ll-display text-lg font-normal"
              style={{ color: "var(--primary)", letterSpacing: "-0.01em" }}
            >
              {formatPrice(total)}
            </span>
          </div>

          <p
            className="ll-body mb-5 text-xs font-light italic leading-relaxed"
            style={{ color: "var(--outline)" }}
          >
            No payment is collected now. Sending these reservations starts a thread with Noemi — she&apos;ll confirm availability and arrange next steps in your account.
          </p>

          {globalError && (
            <p
              className="ll-body mb-3 text-xs"
              role="alert"
              style={{ color: "#991b1b" }}
            >
              {globalError}
            </p>
          )}

          <button
            onClick={reserveAll}
            disabled={submitting || !isLoaded || items.length === 0}
            className="btn-primary block w-full text-center py-4 text-[0.65rem] tracking-[0.15em] mb-3 disabled:opacity-50"
            style={{ border: "none", cursor: submitting ? "wait" : "pointer" }}
          >
            {!isLoaded
              ? "Loading…"
              : !isSignedIn
              ? "Sign In to Reserve →"
              : submitting
              ? "Reserving…"
              : allDone
              ? "Done"
              : count === 1
              ? "Reserve This Piece →"
              : `Reserve ${count} Pieces →`}
          </button>

          <Link
            href="/shop"
            className="ll-label block text-center py-2.5 text-[0.6rem] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
