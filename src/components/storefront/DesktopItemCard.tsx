// src/components/storefront/DesktopItemCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AvailabilityState, InventoryItem } from "@/types/inventory";
import { useCustomerSession } from "@/context/CustomerSessionContext";
import { cfImage, cfSrcSet, WIDTHS, SIZES } from "@/lib/images";
import { formatPrice } from "@/lib/utils";

/**
 * The card accepts an item that may carry an availability `state` set by
 * StorefrontContext. When `state` is undefined the item is available.
 *
 * Sold and Inactive items are filtered out upstream — they should never
 * reach this component. If one does, defensively render nothing so the
 * grid doesn't display garbage.
 */
type ItemWithState = InventoryItem & {
  state?: AvailabilityState;
};

type Props = {
  item:         ItemWithState;
  thumbnailUrl: string | null;
};

// ── Pill styling per state ────────────────────────────────────────────────
//
// Matches the existing FEATURED badge pattern (.ll-label, uppercase, tight
// tracking) so the visual language stays consistent across the grid.

type PillSpec = {
  label:      string;
  background: string;
  color:      string;
};

function pillFor(state: AvailabilityState): PillSpec | null {
  switch (state) {
    case "InBasket":
      return {
        label:      "Sold",
        background: "rgba(30,27,26,0.78)",
        color:      "rgba(253,250,246,0.92)",
      };
    case "PendingPayment":
      return {
        label:      "Sold",
        background: "rgba(30,27,26,0.78)",
        color:      "rgba(253,250,246,0.92)",
      };
    case "YourBasket":
      return {
        label:      "In Your Basket",
        background: "var(--primary)",
        color:      "var(--on-primary)",
      };
    case "YourPendingPayment":
      return {
        label:      "Complete Payment",
        background: "var(--primary)",
        color:      "var(--on-primary)",
      };
    default:
      return null;
  }
}

export default function DesktopItemCard({ item, thumbnailUrl }: Props) {
  const { add, remove, has } = useCustomerSession();
  const router               = useRouter();
  const [busy, setBusy]      = useState(false);
  const [hint, setHint]      = useState<string | null>(null);

  // Defensive — these should be filtered out by StorefrontContext, but if
  // they slip through we render nothing rather than a broken card.
  if (item.state === "Sold" || item.state === "Inactive") return null;

  const state    = item.state;
  const pill     = state ? pillFor(state) : null;
  const inBasket = has(item.inventoryId);

  // What does "interaction" mean for each state?
  //   • undefined        → normal add/remove toggle
  //   • YourBasket       → already yours; route them to the basket tab
  //   • YourPendingPay   → mid-checkout; route to orders so they can resume
  //   • InBasket / Pending → locked. Card remains clickable to the detail
  //                          page, but the add action surfaces as "Sold".
  const isLockedByOther =
    state === "InBasket" || state === "PendingPayment";

  const isYours =
    state === "YourBasket" || state === "YourPendingPayment";

  // The action target for "yours" states. /basket for an active
  // hold; /basket?tab=orders for a pending Square payment so they can
  // resume the checkout in the Orders sub-view.
  const yoursHref =
    state === "YourPendingPayment"
      ? "/basket?tab=orders"
      : "/basket";

  // Add or remove. Async because the signed-in path round-trips the API.
  // We optimistically suppress double-clicks via `busy` rather than locally
  // toggling the UI — `has(...)` is the source of truth, and the basket
  // context updates it as soon as the API call resolves.
  const toggleBasket = async (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate via the wrapping <Link>
    if (busy) return;

    // Pre-flight by state — short-circuit before the network hop.
    if (isLockedByOther) {
      setHint("Sorry, this piece has been sold.");
      return;
    }
    if (isYours) {
      router.push(yoursHref);
      return;
    }

    setBusy(true);
    setHint(null);
    try {
      if (inBasket) {
        await remove(item.inventoryId);
      } else {
        const result = await add({
          inventoryId:    item.inventoryId,
          sku:            item.sku,
          name:           item.name,
          unitPriceCents: item.unitPriceCents,
          thumbnailUrl,
        });

        // Reasoned error surfacing — distinct messages for distinct UX
        // outcomes. "already_in_basket" is a no-op (state will reflect it).
        if (!result.ok) {
          if (result.reason === "needs_email_verify") {
            setHint("Verify your email before adding pieces.");
          } else if (result.reason === "held_by_other") {
            // Race: availability said available at grid-render time but
            // someone grabbed it in the window before this click landed.
            setHint("Sorry, this piece has been sold.");
          } else if (result.reason === "needs_signin") {
            const here = window.location.pathname + window.location.search;
            router.push(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
          } else if (result.reason !== "already_in_basket") {
            setHint(result.message || "Couldn't add that piece.");
          }
        }
      }
    } finally {
      setBusy(false);
    }
  };

  // Label for the small in-card action button. Hover overlay uses
  // a slightly longer label because it has more room.
  const compactLabel: string = (() => {
    if (busy)            return "…";
    if (isYours)         return state === "YourPendingPayment" ? "Pay →" : "View →";
    if (isLockedByOther) return "Sold";
    if (inBasket)        return "✓ Added";
    return "+ Add";
  })();

  const fullLabel: string = (() => {
    if (busy)                           return inBasket ? "Removing…" : "Adding…";
    if (state === "YourBasket")         return "View in Your Basket";
    if (state === "YourPendingPayment") return "Complete Payment →";
    if (isLockedByOther)                return "Sold";
    if (inBasket)                       return "✓ In Basket";
    return "+ Add to Basket";
  })();

  // ─── Render ───────────────────────────────────────────────────────────

  const inner = (
    <>
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4", background: "var(--surface-container-highest)" }}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cfImage(thumbnailUrl, { width: 480 })}
            srcSet={cfSrcSet(thumbnailUrl, WIDTHS.card)}
            sizes={SIZES.cardDesktop}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
            style={{ transitionTimingFunction: "ease-in-out" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center ll-display text-2xl italic" style={{ color: "var(--outline-variant)" }}>
            {process.env.NEXT_PUBLIC_STORE_NAME}
          </div>
        )}

        {/* Hover overlay — suppressed for locked-by-other since there's
            nothing to act on (the card remains clickable to the detail
            page via the wrapping <Link>). */}
        {!isLockedByOther && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-end pb-5 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{ background: "linear-gradient(to top, rgba(30,27,26,0.55) 0%, transparent 55%)" }}
          >
            <span className="btn-primary text-[0.6rem] px-5 py-2.5">
              View Piece
            </span>
            <button
              onClick={toggleBasket}
              disabled={busy}
              className="ll-label text-[0.55rem] uppercase tracking-[0.12em] px-4 py-1.5 transition-all duration-300 disabled:opacity-50"
              style={{
                background:     inBasket || isYours ? "var(--primary)" : "rgba(253,250,246,0.15)",
                color:          inBasket || isYours ? "var(--on-primary)" : "rgba(253,250,246,0.9)",
                border:         inBasket || isYours ? "1px solid var(--primary)" : "1px solid rgba(253,250,246,0.35)",
                borderRadius:   "0.2rem",
                backdropFilter: "blur(4px)",
                cursor:         busy ? "wait" : "pointer",
              }}
            >
              {fullLabel}
            </button>
          </div>
        )}

        {/* Featured badge — top-left */}
        {item.isFeatured && !pill && (
          <div className="absolute left-0 top-4">
            <span
              className="ll-label px-3 py-1 text-[0.52rem] font-medium uppercase tracking-[0.15em]"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Featured
            </span>
          </div>
        )}

        {/* Availability pill — top-left, replaces Featured when both apply
            (the state is more actionable info than the curator badge). */}
        {pill && (
          <div className="absolute left-0 top-4">
            <span
              className="ll-label px-3 py-1 text-[0.52rem] font-medium uppercase tracking-[0.15em]"
              style={{
                background:     pill.background,
                color:          pill.color,
                backdropFilter: "blur(6px)",
              }}
            >
              {pill.label}
            </span>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div
        className="px-4 pb-5 pt-3 transition-all duration-400 group-hover:shadow-ambient"
        style={{ background: "var(--surface-bright)" }}
      >
        <div
          className="ll-display mb-1 text-sm font-normal leading-snug line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.005em" }}
        >
          {item.name}
        </div>

        {item.description && (
          <p className="ll-body mb-3 line-clamp-1 text-xs font-light" style={{ color: "var(--on-surface-variant)" }}>
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="ll-label text-sm font-medium" style={{ color: "var(--primary)" }}>
            {formatPrice(item.unitPriceCents)}
          </span>

          <button
            onClick={toggleBasket}
            disabled={busy || isLockedByOther}
            className="ll-label text-[0.52rem] uppercase tracking-[0.12em] px-2.5 py-1 transition-all duration-300 disabled:opacity-50"
            style={{
              background:
                isLockedByOther                ? "transparent"
                : inBasket || isYours          ? "var(--primary)"
                : "transparent",
              color:
                isLockedByOther                ? "var(--on-surface-variant)"
                : inBasket || isYours          ? "var(--on-primary)"
                : "var(--on-surface-variant)",
              border:
                isLockedByOther                ? "1px dashed rgba(196,181,168,0.4)"
                : inBasket || isYours          ? "1px solid var(--primary)"
                : "1px solid rgba(196,181,168,0.3)",
              borderRadius: "0.2rem",
              cursor:       busy ? "wait" : isLockedByOther ? "not-allowed" : "pointer",
            }}
          >
            {compactLabel}
          </button>
        </div>

        {/* Inline error hint — clears on the next interaction. Kept short
            because the card is space-constrained. */}
        {hint && (
          <p
            className="ll-body mt-2 rounded-sm px-2 py-1.5 text-[0.7rem] font-medium not-italic leading-snug"
            style={{
              color:      "#7f1d1d",
              background: "rgba(153,27,27,0.08)",
              border:     "1px solid rgba(153,27,27,0.25)",
            }}
          >
            {hint}
          </p>
        )}
      </div>
    </>
  );

  // Every card — including locked-by-other — wraps in <Link> so users can
  // browse the detail page regardless of basket state. The action button
  // is what carries the unavailability, not the navigation.
  return (
    <Link
      href={`/shop/${item.sku}`}
      className="group relative block overflow-hidden transition-all duration-400"
      style={{ textDecoration: "none", background: "var(--surface-bright)", borderRadius: "0.25rem" }}
    >
      {inner}
    </Link>
  );
}